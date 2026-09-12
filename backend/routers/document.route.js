import express from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import {
  uploadCaseDocument,
  deleteCaseDocument,
  getCaseDocuments,
  viewCaseDocument,
} from '../controllers/document.controller.js';

const router = express.Router({ mergeParams: true });

// Direct inline viewing routes (opens in browser tab without downloading)
router.get('/view/:id/:fileId', viewCaseDocument);
router.get('/view/:fileId', viewCaseDocument);
router.get('/view', viewCaseDocument);

// Wrapper to handle Multer upload errors gracefully
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('file');
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File size exceeds the 2 GB maximum limit.',
        });
      }
      return res.status(400).json({
        message: err.message || 'File upload failed during processing.',
      });
    }
    next();
  });
};

// All document modification routes require authentication
router.use(verifyToken);

// Upload a document to a case
router.post(
  '/:id/documents',
  authorizeRoles('OR', 'SLC', 'ADM', 'DEV', 'ADV'),
  handleUpload,
  uploadCaseDocument
);

// Delete an attached document from a case
router.delete(
  '/:id/documents/:fileId',
  authorizeRoles('OR', 'SLC', 'ADM', 'DEV', 'ADV'),
  deleteCaseDocument
);

// Get all documents for a case
router.get(
  '/:id/documents',
  authorizeRoles('OR', 'SLC', 'ADM', 'DEV', 'ADV'),
  getCaseDocuments
);

export default router;
