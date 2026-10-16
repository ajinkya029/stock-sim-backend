import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { marketSimulator } from '../services/marketSimulator.js';

let io = null;

/**
 * Socket.IO events
 *  server -> client:
 *    market:snapshot   full list of quotes, sent on connect
 *    market:tick       array of updated quotes, every TICK_INTERVAL_MS
 *    trade:executed    { transaction, cash }, sent only to the trading user
 *  client -> server: none required (authenticate via handshake auth.token)
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('market');
    socket.join(`user:${socket.user.id}`);
    socket.emit('market:snapshot', marketSimulator.getAll());
  });

  return io;
}

export const getIo = () => io;
