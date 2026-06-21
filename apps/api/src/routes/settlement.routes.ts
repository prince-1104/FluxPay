import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createSettlementSchema,
  updateSettlementSchema,
  tripIdParamSchema,
} from '../validators/schemas.js';
import * as settlementService from '../services/settlement.service.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(requireAuth);

const settlementIdSchema = z.object({ settlementId: z.string().uuid() });

router.get('/', validate(tripIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const settlements = await settlementService.listSettlements(req.params.tripId, authReq.user.id);
    res.json({ data: settlements });
  } catch (e) {
    next(e);
  }
});

router.get('/suggestions', validate(tripIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const suggestions = await settlementService.generateSuggestedSettlements(req.params.tripId, authReq.user.id);
    res.json({ data: suggestions });
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(tripIdParamSchema, 'params'), validate(createSettlementSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const settlement = await settlementService.createSettlement(req.params.tripId, authReq.user.id, req.body);
    res.status(201).json({ data: settlement });
  } catch (e) {
    next(e);
  }
});

router.patch('/:settlementId', validate(tripIdParamSchema, 'params'), validate(settlementIdSchema, 'params'), validate(updateSettlementSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const settlement = await settlementService.updateSettlement(
      req.params.tripId,
      req.params.settlementId,
      authReq.user.id,
      req.body
    );
    res.json({ data: settlement });
  } catch (e) {
    next(e);
  }
});

export default router;
