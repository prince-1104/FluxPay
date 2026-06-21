import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { formatCurrency } from '@settl/utils';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
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
