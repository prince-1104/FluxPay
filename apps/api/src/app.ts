import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { formatCurrency } from '@settl/utils';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === env.clientUrl) return true;
  if (env.nodeEnv === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: env.nodeEnv,
    sample: formatCurrency(499, 'INR'),
  });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
