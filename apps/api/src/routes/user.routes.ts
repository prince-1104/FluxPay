import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, searchUsersSchema } from '../validators/schemas.js';
import * as userService from '../services/user.service.js';
import { getCurrentSubscription, listPlans } from '../services/cashfree.service.js';
import { registerFcmToken } from '../services/push.service.js';

const router = Router();

router.get('/search', requireAuth, validate(searchUsersSchema, 'query'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { q } = req.query as { q: string };
    const users = await userService.searchUsers(authReq.user.id, q);
    res.json({ data: users });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await userService.getUserById(authReq.user.id);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
});

router.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await userService.updateProfile(authReq.user.id, req.body);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
});

router.get('/subscription', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const sub = await getCurrentSubscription(authReq.user.id);
    res.json({ data: sub });
  } catch (e) {
    next(e);
  }
});

router.post('/fcm-token', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ error: 'FCM token required' });
      return;
    }
    const result = await registerFcmToken(authReq.user.id, token);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.get('/plans', async (_req, res, next) => {
  try {
    const plans = await listPlans();
    res.json({ data: plans });
  } catch (e) {
    next(e);
  }
});

export default router;
