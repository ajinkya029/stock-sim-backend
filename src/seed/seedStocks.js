// Seeds the Stock collection with illustrative starting prices.
// These are simulated instruments, not live market data.
import Stock from '../models/Stock.js';
import { connectDB, disconnectDB } from '../config/db.js';

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 190.0, volatility: 0.012 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', price: 415.0, volatility: 0.011 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', price: 875.0, volatility: 0.025 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 168.0, volatility: 0.014 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', price: 182.0, volatility: 0.015 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', price: 246.0, volatility: 0.03 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', price: 493.0, volatility: 0.018 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Media', price: 612.0, volatility: 0.02 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', price: 202.0, volatility: 0.012 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Technology', price: 1480.0, volatility: 0.013 },
];

async function seed() {
  await connectDB();

  await Stock.bulkWrite(
    STOCKS.map((s) => ({
      updateOne: {
        filter: { symbol: s.symbol },
        update: {
          $set: { name: s.name, sector: s.sector, volatility: s.volatility },
          $setOnInsert: {
            price: s.price,
            previousClose: s.price,
            dayHigh: s.price,
            dayLow: s.price,
            volume: 0,
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    }))
  );

  console.log(`Seeded ${STOCKS.length} stocks`);
  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
