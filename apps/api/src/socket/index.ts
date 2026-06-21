import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin:
        env.nodeEnv === 'development'
          ? (origin, callback) => {
              if (!origin || origin === env.clientUrl || /^http:\/\/localhost:\d+$/.test(origin)) {
                callback(null, true);
              } else {
                callback(new Error('Not allowed by CORS'));
              }
            }
          : env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as Socket & { userId: string }).userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket & { userId?: string }) => {
    const userId = socket.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('trip:join', (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('trip:leave', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', () => {
      // cleanup handled by socket.io
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
