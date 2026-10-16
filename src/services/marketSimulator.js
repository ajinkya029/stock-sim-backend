import Stock from '../models/Stock.js';
import { round2 } from '../utils/money.js';

// Box-Muller transform: standard normal random number.
function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * In-memory market simulator. Prices follow a geometric random walk and are
 * ticked on an interval. The cache is periodically flushed to MongoDB.
 */
class MarketSimulator {
  constructor() {
    this.quotes = new Map();
    this.dirty = new Set();
    this.tickTimer = null;
    this.persistTimer = null;
    this.onTick = null;
  }

  async load() {
    const docs = await Stock.find().lean();
    this.quotes.clear();
    for (const d of docs) {
      this.quotes.set(d.symbol, {
        symbol: d.symbol,
        name: d.name,
        sector: d.sector,
        price: d.price,
        previousClose: d.previousClose,
        dayHigh: d.dayHigh,
        dayLow: d.dayLow,
        volume: d.volume,
        volatility: d.volatility,
        lastUpdated: d.lastUpdated,
      });
    }
    return this.quotes.size;
  }

  publicQuote(q) {
    const change = round2(q.price - q.previousClose);
    return {
      symbol: q.symbol,
      name: q.name,
      sector: q.sector,
      price: q.price,
      previousClose: q.previousClose,
      change,
      changePercent: round2((change / q.previousClose) * 100),
      dayHigh: q.dayHigh,
      dayLow: q.dayLow,
      volume: q.volume,
      lastUpdated: q.lastUpdated,
    };
  }

  getQuote(symbol) {
    const q = this.quotes.get(String(symbol).toUpperCase());
    return q ? this.publicQuote(q) : null;
  }

  getPrice(symbol) {
    return this.quotes.get(String(symbol).toUpperCase())?.price ?? null;
  }

  getAll() {
    return [...this.quotes.values()].map((q) => this.publicQuote(q));
  }

  tick() {
    const now = new Date();
    const updated = [];
    for (const q of this.quotes.values()) {
      const shock = gaussian() * q.volatility;
      q.price = Math.max(0.01, round2(q.price * (1 + shock)));
      q.dayHigh = Math.max(q.dayHigh, q.price);
      q.dayLow = Math.min(q.dayLow, q.price);
      q.volume += Math.floor(Math.random() * 5000) + 100;
      q.lastUpdated = now;
      this.dirty.add(q.symbol);
      updated.push(this.publicQuote(q));
    }
    if (this.onTick) this.onTick(updated);
  }

  async persist() {
    if (this.dirty.size === 0) return;
    const ops = [...this.dirty].map((symbol) => {
      const q = this.quotes.get(symbol);
      return {
        updateOne: {
          filter: { symbol },
          update: {
            $set: {
              price: q.price,
              dayHigh: q.dayHigh,
              dayLow: q.dayLow,
              volume: q.volume,
              lastUpdated: q.lastUpdated,
            },
          },
        },
      };
    });
    this.dirty.clear();
    await Stock.bulkWrite(ops);
  }

  start({ tickIntervalMs, persistIntervalMs, onTick }) {
    this.onTick = onTick;
    this.tickTimer = setInterval(() => this.tick(), tickIntervalMs);
    this.persistTimer = setInterval(() => {
      this.persist().catch((err) => console.error('Price persist failed:', err.message));
    }, persistIntervalMs);
  }

  async stop() {
    clearInterval(this.tickTimer);
    clearInterval(this.persistTimer);
    await this.persist();
  }
}

export const marketSimulator = new MarketSimulator();
