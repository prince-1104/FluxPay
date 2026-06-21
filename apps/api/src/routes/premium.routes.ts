import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCheckoutSession,
  handleWebhook,
  simulateUpgrade,
} from '../services/cashfree.service.js';
import { exportTripCsv, exportTripSummary } from '../services/export.service.js';
import { scanReceipt } from '../services/receipt.service.js';

const router = Router();

router.post('/checkout', requireAuth, validate(z.object({
  tier: z.enum(['PRO', 'PREMIUM']),
  billing: z.enum(['monthly', 'yearly']),
})), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const session = await createCheckoutSession(authReq.user.id, req.body.tier, req.body.billing);
    res.json({ data: session });
  } catch (e) {
    next(e);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const result = await handleWebhook(req.body);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/simulate-upgrade', requireAuth, validate(z.object({
  tier: z.enum(['FREE', 'PRO', 'PREMIUM']),
})), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const plan = await simulateUpgrade(authReq.user.id, req.body.tier);
    res.json({ data: plan });
  } catch (e) {
    next(e);
  }
});

router.get('/export/:tripId/csv', requireAuth, validate(z.object({ tripId: z.string().uuid() }), 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const csv = await exportTripCsv(req.params.tripId, authReq.user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trip-${req.params.tripId}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

router.get('/export/:tripId/summary', requireAuth, validate(z.object({ tripId: z.string().uuid() }), 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const summary = await exportTripSummary(req.params.tripId, authReq.user.id);
    res.json({ data: summary });
  } catch (e) {
    next(e);
  }
});

router.post('/receipt/scan', requireAuth, validate(z.object({
  imageBase64: z.string().min(1),
})), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await scanReceipt(authReq.user.id, req.body.imageBase64);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
