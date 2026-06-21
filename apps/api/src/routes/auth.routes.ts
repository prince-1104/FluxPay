import { Router, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, refreshSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result, message: 'Account created' });
  } catch (e) {
    next(e);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const token = req.headers.authorization?.slice(7);
    await authService.logout(authReq.user.id, token);
    res.json({ data: { success: true } });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getMe(authReq.user.id);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
});

export default router;
