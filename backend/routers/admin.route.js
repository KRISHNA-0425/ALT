import express from 'express';
import {
  getAdminAnalytics,
  getAdminPipeline,
  toggleCaseFlag,
  requestCaseUpdate,
  sendDirectMessage,
  getDepartmentPersonnel,
  getAdminTargets,
  setAdminTarget,
} from '../controllers/admin.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Enforce authentication for all Admin endpoints
router.use(verifyToken);

// Targets viewable by team members (e.g. Outreach viewing SL target progress)
router.get('/targets', getAdminTargets);

// Administrative operations restricted to ADM and DEV roles
router.use(authorizeRoles('ADM', 'DEV'));

router.get('/analytics', getAdminAnalytics);
router.get('/pipeline', getAdminPipeline);
router.post('/cases/:id/flag', toggleCaseFlag);
router.post('/cases/:id/request-update', requestCaseUpdate);
router.post('/messages', sendDirectMessage);
router.get('/personnel', getDepartmentPersonnel);
router.post('/targets', setAdminTarget);

export default router;
