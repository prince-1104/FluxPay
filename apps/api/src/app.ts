import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { User } from '@settl/types';
import { formatCurrency } from '@settl/utils';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  const dummyUser: Partial<User> = {
    name: 'Settl User',
    email: 'user@settl.com',
  };
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: `Welcome, ${dummyUser.name}! Currency example: ${formatCurrency(100)}`,
  });
});

export default app;
