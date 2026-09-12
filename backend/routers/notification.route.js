import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller.js';

const router = express.Router();

// Support token verification, but allow query fallback if needed
router.use((req, res, next) => {
  // If authorization header or cookies exist, verify token
  if (req.headers.authorization || (req.cookies && req.cookies.token)) {
    return verifyToken(req, res, next);
  }
  // Otherwise proceed with query params (e.g. ?userID=ADV10041&role=ADV)
  next();
});

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.post('/mark-all-read', markAllNotificationsAsRead);

export default router;
