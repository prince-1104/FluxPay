import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';
import { initRedis } from './lib/redis.js';

const server = http.createServer(app);
initSocket(server);

async function start() {
  const redisOk = await initRedis();
  if (redisOk) {
    console.log('[API] Redis connected');
  } else {
    console.warn('[API] Redis unavailable — token blacklist disabled');
  }

  server.listen(env.port, () => {
    console.log(`[API] Server running on port ${env.port}`);
    console.log(`[API] Health: http://localhost:${env.port}/health`);
  });
}

start();
