import express from 'express';
import {
  advocateLogin,
  getMyAdvocateProfile,
  getAllAdvocates,
  getTopAdvocates,
  getAdvocateById,
  getMyAssignedCases,
  addAdvocateCaseFields,
  deleteAdvocateDocument,
  unassignAdvocateFromCase,
} from '../controllers/advocate.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { pdfUpload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public advocate login endpoint
router.post('/login', advocateLogin);

// Protected advocate routes
router.get('/me', verifyToken, getMyAdvocateProfile);
router.get('/top', verifyToken, getTopAdvocates);
router.get('/assigned-cases', verifyToken, getMyAssignedCases);
router.post('/cases/:id/add-fields', verifyToken, pdfUpload.single('file'), addAdvocateCaseFields);
router.delete('/cases/:id/documents/:fileId', verifyToken, deleteAdvocateDocument);
router.post('/cases/:id/unassign', verifyToken, unassignAdvocateFromCase);
router.get('/', verifyToken, getAllAdvocates);
router.get('/:identifier', verifyToken, getAdvocateById);

export default router;

