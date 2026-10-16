import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  sector: { type: String, default: 'General' },
  price: { type: Number, required: true, min: 0 },
  previousClose: { type: Number, required: true, min: 0 },
  dayHigh: { type: Number, required: true },
  dayLow: { type: Number, required: true },
  volume: { type: Number, default: 0 },
  // Per-tick volatility as a fraction (0.02 = roughly 2% move per tick, 1 sigma).
  volatility: { type: Number, default: 0.02, min: 0, max: 0.5 },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model('Stock', stockSchema);
