import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { marketSimulator } from './marketSimulator.js';
import ApiError from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';

const MAX_ATTEMPTS = 3;

/**
 * Executes a market order at the current simulated price.
 * Uses optimistic concurrency (updatedAt as a version check) instead of
 * multi-document transactions, so it works on standalone MongoDB as well.
 */
export async function executeTrade({ userId, symbol, side, quantity }) {
  const sym = symbol.toUpperCase();
  const price = marketSimulator.getPrice(sym);
  if (price === null) throw new ApiError(404, `Unknown symbol: ${sym}`);

  const total = round2(price * quantity);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const holdings = user.holdings.map((h) => ({
      symbol: h.symbol,
      quantity: h.quantity,
      avgCost: h.avgCost,
    }));
    const idx = holdings.findIndex((h) => h.symbol === sym);
    let cash = user.cash;

    if (side === 'buy') {
      if (cash < total) {
        throw new ApiError(400, `Insufficient cash. Need ${total}, available ${round2(cash)}`);
      }
      cash = round2(cash - total);
      if (idx >= 0) {
        const h = holdings[idx];
        const newQty = h.quantity + quantity;
        h.avgCost = round2((h.avgCost * h.quantity + price * quantity) / newQty);
        h.quantity = newQty;
      } else {
        holdings.push({ symbol: sym, quantity, avgCost: price });
      }
    } else {
      if (idx < 0 || holdings[idx].quantity < quantity) {
        throw new ApiError(400, `Insufficient shares of ${sym}`);
      }
      cash = round2(cash + total);
      holdings[idx].quantity -= quantity;
      if (holdings[idx].quantity === 0) holdings.splice(idx, 1);
    }

    const result = await User.updateOne(
      { _id: userId, updatedAt: user.updatedAt },
      { $set: { cash, holdings, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      const transaction = await Transaction.create({
        user: userId,
        symbol: sym,
        side,
        quantity,
        price,
        total,
      });
      return { transaction, cash, holdings };
    }
    // Another request modified the user between read and write; retry.
  }

  throw new ApiError(409, 'Trade conflicted with another request, please retry');
}
