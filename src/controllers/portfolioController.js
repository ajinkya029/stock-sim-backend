import User from '../models/User.js';
import { marketSimulator } from '../services/marketSimulator.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { round2 } from '../utils/money.js';

export const getPortfolio = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) throw new ApiError(404, 'User not found');

  const holdings = user.holdings.map((h) => {
    const currentPrice = marketSimulator.getPrice(h.symbol) ?? 0;
    const marketValue = round2(currentPrice * h.quantity);
    const costBasis = round2(h.avgCost * h.quantity);
    const unrealizedPnL = round2(marketValue - costBasis);
    return {
      symbol: h.symbol,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPnL,
      unrealizedPnLPercent: costBasis ? round2((unrealizedPnL / costBasis) * 100) : 0,
    };
  });

  const holdingsValue = round2(holdings.reduce((sum, h) => sum + h.marketValue, 0));
  const cash = round2(user.cash);
  const equity = round2(cash + holdingsValue);
  const totalReturn = round2(equity - user.startingCash);

  res.json({
    cash,
    holdingsValue,
    equity,
    startingCash: user.startingCash,
    totalReturn,
    totalReturnPercent: round2((totalReturn / user.startingCash) * 100),
    holdings,
  });
});
