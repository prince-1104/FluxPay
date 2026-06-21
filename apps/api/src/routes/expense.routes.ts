import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  tripIdParamSchema,
  idParamSchema,
} from '../validators/schemas.js';
import * as expenseService from '../services/expense.service.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(requireAuth);

const expenseIdSchema = z.object({ expenseId: z.string().uuid() });

router.get('/', validate(tripIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expenses = await expenseService.listExpenses(req.params.tripId, authReq.user.id);
    res.json({ data: expenses });
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(tripIdParamSchema, 'params'), validate(createExpenseSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expense = await expenseService.createExpense(req.params.tripId, authReq.user.id, req.body);
    res.status(201).json({ data: expense });
  } catch (e) {
    next(e);
  }
});

router.get('/:expenseId', validate(tripIdParamSchema, 'params'), validate(expenseIdSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expense = await expenseService.getExpense(req.params.tripId, req.params.expenseId, authReq.user.id);
    res.json({ data: expense });
  } catch (e) {
    next(e);
  }
});

router.patch('/:expenseId', validate(tripIdParamSchema, 'params'), validate(expenseIdSchema, 'params'), validate(updateExpenseSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expense = await expenseService.updateExpense(req.params.tripId, req.params.expenseId, authReq.user.id, req.body);
    res.json({ data: expense });
  } catch (e) {
    next(e);
  }
});

router.delete('/:expenseId', validate(tripIdParamSchema, 'params'), validate(expenseIdSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await expenseService.deleteExpense(req.params.tripId, req.params.expenseId, authReq.user.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
