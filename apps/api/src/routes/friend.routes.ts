import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { friendRequestSchema, friendshipIdParamSchema } from '../validators/schemas.js';
import * as friendService from '../services/friend.service.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const friends = await friendService.listFriends(authReq.user.id);
    res.json({ data: friends });
  } catch (e) {
    next(e);
  }
});

router.get('/requests', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requests = await friendService.listPendingRequests(authReq.user.id);
    res.json({ data: requests });
  } catch (e) {
    next(e);
  }
});

router.post('/request', validate(friendRequestSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await friendService.sendFriendRequest(authReq.user.id, req.body);
    res.status(201).json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/accept', validate(friendshipIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await friendService.acceptFriendRequest(authReq.user.id, req.params.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reject', validate(friendshipIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await friendService.rejectFriendRequest(authReq.user.id, req.params.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(friendshipIdParamSchema, 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await friendService.removeFriend(authReq.user.id, req.params.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
