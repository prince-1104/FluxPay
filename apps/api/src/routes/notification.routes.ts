import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import * as notificationService from '../services/notification.service.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.listNotifications(authReq.user.id, unreadOnly);
    res.json({ data: notifications });
  } catch (e) {
    next(e);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const count = await notificationService.getUnreadCount(authReq.user.id);
    res.json({ data: count });
  } catch (e) {
    next(e);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await notificationService.markAllNotificationsRead(authReq.user.id);
    res.json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', validate(z.object({ id: z.string().uuid() }), 'params'), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const notification = await notificationService.markNotificationRead(authReq.user.id, req.params.id);
    res.json({ data: notification });
  } catch (e) {
    next(e);
  }
});

export default router;
