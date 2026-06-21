import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTripSchema,
  updateTripSchema,
  joinTripSchema,
  idParamSchema,
  preContributionSchema,
} from '../validators/schemas.js';
import * as tripService from '../services/trip.service.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const trips = await tripService.listTrips(authReq.user.id);
    res.json({ data: trips });
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createTripSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const trip = await tripService.createTrip(authReq.user.id, req.body);
    res.status(201).json({ data: trip });
  } catch (e) {
    next(e);
  }
});

router.post('/join', validate(joinTripSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const member = await tripService.joinTrip(authReq.user.id, req.body.inviteCode, req.body.displayName);
    res.json({ data: member });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const trip = await tripService.getTrip(req.params.id, authReq.user.id);
    res.json({ data: trip });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(idParamSchema, 'params'), validate(updateTripSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const trip = await tripService.updateTrip(req.params.id, authReq.user.id, req.body);
    res.json({ data: trip });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await tripService.deleteTrip(req.params.id, authReq.user.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/leave', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await tripService.leaveTrip(req.params.id, authReq.user.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/balances', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const balances = await tripService.getTripBalances(req.params.id, authReq.user.id);
    res.json({ data: balances });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/contributions', validate(idParamSchema, 'params'), validate(preContributionSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const contribution = await tripService.addPreContribution(req.params.id, authReq.user.id, req.body);
    res.status(201).json({ data: contribution });
  } catch (e) {
    next(e);
  }
});

export default router;
