import Transaction from '../models/Transaction.js';
import { executeTrade } from '../services/tradeService.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getIo } from '../sockets/index.js';

const MAX_QUANTITY = 1_000_000;

export const placeTrade = asyncHandler(async (req, res) => {
  const { symbol, side } = req.body;
  const quantity = Number(req.body.quantity);

  if (typeof symbol !== 'string' || !symbol.trim()) {
    throw new ApiError(400, 'symbol is required');
  }
  if (!['buy', 'sell'].includes(side)) {
    throw new ApiError(400, "side must be 'buy' or 'sell'");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new ApiError(400, `quantity must be an integer between 1 and ${MAX_QUANTITY}`);
  }

  const result = await executeTrade({
    userId: req.user.id,
    symbol: symbol.trim(),
    side,
    quantity,
  });

  getIo()?.to(`user:${req.user.id}`).emit('trade:executed', {
    transaction: result.transaction,
    cash: result.cash,
  });

  res.status(201).json(result);
});

export const getTradeHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const transactions = await Transaction.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ transactions });
});
