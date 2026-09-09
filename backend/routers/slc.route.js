import express from 'express';
import {
  createSlcRecord,
  getAllSlcRecords,
  getSlcById,
  getSlcByOutreachId,
  updateSlcRecord,
  addSlcFollowUp,
  deleteSlcRecord,
} from '../controllers/slc.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all SLC routes for SLC, ADM, and DEV roles
router.use(verifyToken, authorizeRoles('SLC', 'ADM', 'DEV'));

router.post('/', createSlcRecord);
router.get('/', getAllSlcRecords);
router.get('/:id', getSlcById);
router.get('/by-outreach/:outreachId', getSlcByOutreachId);
router.put('/:id', updateSlcRecord);
router.post('/:id/follow-up', addSlcFollowUp);
router.delete('/:id', deleteSlcRecord);

export default router;
