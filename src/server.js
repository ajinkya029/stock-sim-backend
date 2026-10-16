import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import { marketSimulator } from './services/marketSimulator.js';

async function main() {
  await connectDB();

  const loaded = await marketSimulator.load();
  if (loaded === 0) {
    console.warn('No stocks found in the database. Run `npm run seed` first.');
  }

  const server = http.createServer(app);
  const io = initSocket(server);

  marketSimulator.start({
    tickIntervalMs: env.tickIntervalMs,
    persistIntervalMs: env.persistIntervalMs,
    onTick: (quotes) => io.to('market').emit('market:tick', quotes),
  });

  server.listen(env.port, () => {
    console.log(`Stock simulator API listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    await marketSimulator.stop();
    io.close();
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
