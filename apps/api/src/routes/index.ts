import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import tripRoutes from './trip.routes.js';
import expenseRoutes from './expense.routes.js';
import settlementRoutes from './settlement.routes.js';
import notificationRoutes from './notification.routes.js';
import premiumRoutes from './premium.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/trips/:tripId/expenses', expenseRoutes);
router.use('/trips/:tripId/settlements', settlementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/premium', premiumRoutes);

export default router;
