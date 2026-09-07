import express from 'express';
import {
    createOutreach,
    getAllOutreach,
    getOutreachById,
    updateOutreach,
    deleteOutreach,
    addFollowUp,
} from '../controllers/outreach.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication and role check (accessible to 'OR' role as well as 'ADM')
router.use(verifyToken);
router.use(authorizeRoles('OR', 'ADM', 'DEV'));

// CRUD Routes
router.post('/', createOutreach);
router.get('/', getAllOutreach);
router.get('/:id', getOutreachById);
router.put('/:id', updateOutreach);
router.delete('/:id', deleteOutreach);
router.post('/:id/follow-up', addFollowUp);

export default router;
