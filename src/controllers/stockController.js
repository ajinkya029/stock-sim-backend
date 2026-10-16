import { marketSimulator } from '../services/marketSimulator.js';
import ApiError from '../utils/ApiError.js';

export function listStocks(_req, res) {
  res.json({ stocks: marketSimulator.getAll() });
}

export function getStock(req, res) {
  const quote = marketSimulator.getQuote(req.params.symbol);
  if (!quote) throw new ApiError(404, `Unknown symbol: ${req.params.symbol}`);
  res.json({ stock: quote });
}
