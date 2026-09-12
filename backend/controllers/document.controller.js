import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Outreach, { DOCUMENTS_SUBMITTED_OPTIONS } from '../models/OutReach.model.js';
import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';
import { uploadLargeFile, deleteFromCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { removeLocalFile } from '../middlewares/upload.middleware.js';

/**
 * Upload a document (PDF / JPEG / PNG) to Cloudinary (with local fallback if permissions fail)
 * POST /api/outreach/:id/documents
 */
export const uploadCaseDocument = async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file provided or file type not allowed' });
  }

  const localFilePath = file.path;

  try {
    const caseDoc = await Outreach.findById(id);
    if (!caseDoc) {
      await removeLocalFile(localFilePath);
      return res.status(404).json({ message: 'Case record not found' });
    }

    const documentType = req.body.documentType || 'FIR';
    const title = req.body.title || file.originalname;
    const isImage = file.mimetype.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    let uploadResult = null;
    let isLocalFallback = false;

    // 1. If Cloudinary is configured, attempt upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const folderName = `socio_legal_documents/${caseDoc.slcNo || caseDoc.sNo || id}`;
        uploadResult = await uploadLargeFile(localFilePath, {
          resource_type: resourceType,
          folder: folderName,
          public_id: `${documentType.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
        });
        // Remove temp file from server disk now that Cloudinary has it
        await removeLocalFile(localFilePath);
      } catch (cloudErr) {
        console.warn('Cloudinary upload error:', cloudErr.message);

        // If Cloudinary returned 403 Forbidden due to API key permissions, fallback to local storage
        if (
          cloudErr.http_code === 403 ||
          (cloudErr.message && (cloudErr.message.includes('403') || cloudErr.message.includes('missing permissions')))
        ) {
          console.log('Falling back to local disk storage because Cloudinary API key lacks create permissions.');
          isLocalFallback = true;
        } else {
          throw cloudErr;
        }
      }
    } else {
      isLocalFallback = true;
    }

    // 2. Local Storage Fallback (if Cloudinary is unconfigured or rejected the key with 403)
    if (isLocalFallback) {
      const permanentDir = path.join(process.cwd(), 'uploads', 'documents', 'socio_legal');
      if (!fs.existsSync(permanentDir)) {
        fs.mkdirSync(permanentDir, { recursive: true });
      }

      const permFileName = path.basename(localFilePath);
      const permDest = path.join(permanentDir, permFileName);
      await fs.promises.rename(localFilePath, permDest);

      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const fileUrl = `${protocol}://${host}/uploads/documents/socio_legal/${permFileName}`;

      uploadResult = {
        secure_url: fileUrl,
        url: fileUrl,
        public_id: `local_${permFileName}`,
        resource_type: 'local',
        bytes: file.size,
      };
    }

    const newFileEntry = {
      documentType,
      title,
      section: 'SocioLegal',
      originalName: file.originalname,
      fileUrl: uploadResult.secure_url || uploadResult.url,
      publicId: uploadResult.public_id,
      fileType: file.mimetype,
      resourceType: uploadResult.resource_type || resourceType,
      fileSize: uploadResult.bytes || file.size,
      uploadedBy: req.user?._id,
      uploadedByRole: req.user?.roles || req.user?.role || 'OR',
      uploadedByName: req.user?.userName || 'User',
      uploadedAt: new Date(),
    };

    if (!caseDoc.attachedFiles) {
      caseDoc.attachedFiles = [];
    }
    caseDoc.attachedFiles.push(newFileEntry);

    // Auto-update documentsSubmitted tags if applicable
    if (DOCUMENTS_SUBMITTED_OPTIONS.includes(documentType)) {
      if (!caseDoc.documentsSubmitted) {
        caseDoc.documentsSubmitted = [];
      }
      if (!caseDoc.documentsSubmitted.includes(documentType)) {
        caseDoc.documentsSubmitted.push(documentType);
      }
    }

    await caseDoc.save();

    const successMessage = isLocalFallback
      ? 'Document uploaded and saved to server storage (Note: Cloudinary API key has restricted upload permissions).'
      : 'Document uploaded successfully to Cloudinary';

    return res.status(201).json({
      message: successMessage,
      file: caseDoc.attachedFiles[caseDoc.attachedFiles.length - 1],
      attachedFiles: caseDoc.attachedFiles,
      documentsSubmitted: caseDoc.documentsSubmitted,
      isLocalFallback,
    });
  } catch (error) {
    // Ensure temp file is cleaned up even on failure
    await removeLocalFile(localFilePath);
    console.error('Error in uploadCaseDocument:', error);

    let clientMessage = error.message || 'Failed to upload document';
    let statusCode = 500;

    if (
      error.http_code === 403 ||
      (error.message && (error.message.includes('403') || error.message.includes('missing permissions')))
    ) {
      statusCode = 403;
      clientMessage =
        'Cloudinary Permission Error: The API Key currently in backend/.env does not have permission to upload files (actions=["create"]). In your Cloudinary Console (https://console.cloudinary.com), please use the Master API Key & Secret from your Dashboard, or go to Settings -> Access Keys and grant "Media Library: Upload / Create" permissions to this key.';
    }

    return res.status(statusCode).json({
      message: clientMessage,
    });
  }
};

/**
 * Delete an attached document from Cloudinary or local storage and remove from MongoDB
 * DELETE /api/outreach/:id/documents/:fileId
 */
export const deleteCaseDocument = async (req, res) => {
  const { id, fileId } = req.params;

  try {
    const caseDoc = await Outreach.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case record not found' });
    }

    const fileIndex = (caseDoc.attachedFiles || []).findIndex(
      (f) => f._id.toString() === fileId || f.publicId === fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({ message: 'Attached file not found on this case' });
    }

    const targetFile = caseDoc.attachedFiles[fileIndex];

    // Delete from Local Storage or Cloudinary
    try {
      if (targetFile.resourceType === 'local' || targetFile.publicId?.startsWith('local_')) {
        const fileName = targetFile.publicId.replace('local_', '');
        const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName);
        await removeLocalFile(filePath);
      } else if (targetFile.publicId) {
        await deleteFromCloudinary(targetFile.publicId, targetFile.resourceType || 'raw');
      }
    } catch (deleteErr) {
      console.warn('Could not delete file from storage:', deleteErr.message);
    }

    // Remove from MongoDB array
    caseDoc.attachedFiles.splice(fileIndex, 1);
    await caseDoc.save();

    return res.status(200).json({
      message: 'Document deleted successfully',
      attachedFiles: caseDoc.attachedFiles,
    });
  } catch (error) {
    console.error('Error in deleteCaseDocument:', error);
    return res.status(500).json({
      message: error.message || 'Failed to delete document',
    });
  }
};

/**
 * Get all attached documents for a case
 * GET /api/outreach/:id/documents
 */
export const getCaseDocuments = async (req, res) => {
  const { id } = req.params;

  try {
    const caseDoc = await Outreach.findById(id).select('attachedFiles documentsSubmitted sNo slcNo inmate');
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case record not found' });
    }

    return res.status(200).json({
      attachedFiles: caseDoc.attachedFiles || [],
      documentsSubmitted: caseDoc.documentsSubmitted || [],
    });
  } catch (error) {
    console.error('Error in getCaseDocuments:', error);
    return res.status(500).json({
      message: error.message || 'Failed to fetch documents',
    });
  }
};

/**
 * View / Stream an attached document (PDF or Image) inline in browser tab without downloading
 * GET /api/documents/view/:id/:fileId or GET /api/documents/view/:fileId
 */
export const viewCaseDocument = async (req, res) => {
  const { id, fileId } = req.params;
  const targetId = fileId || id || req.query.fileId || req.query.id;
  const queryCaseId = req.query.caseId || (fileId ? id : null);
  const decodedTargetId = targetId ? decodeURIComponent(targetId) : '';

  try {
    let targetFile = null;

    // 1. Try finding case by id first if valid ObjectId
    const searchCaseId = queryCaseId || (id && mongoose.Types.ObjectId.isValid(id) ? id : null);
    if (searchCaseId && mongoose.Types.ObjectId.isValid(searchCaseId)) {
      const caseDoc =
        (await Outreach.findById(searchCaseId)) || (await SocioLegalCounselling.findById(searchCaseId));
      if (caseDoc && caseDoc.attachedFiles) {
        targetFile = caseDoc.attachedFiles.find(
          (f) =>
            (f._id && f._id.toString() === targetId) ||
            f.publicId === targetId ||
            f.publicId === decodedTargetId ||
            (f.publicId && f.publicId.endsWith(targetId)) ||
            (targetId && f.publicId && targetId.endsWith(f.publicId))
        );
      }
    }

    // 2. Build safe Mongoose query conditions
    const queryConditions = [
      { 'attachedFiles.publicId': targetId },
      { 'attachedFiles.publicId': decodedTargetId },
    ];
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      queryConditions.push({ 'attachedFiles._id': targetId });
    }

    // Search Outreach
    if (!targetFile) {
      const orCase = await Outreach.findOne({ $or: queryConditions });
      if (orCase && orCase.attachedFiles) {
        targetFile = orCase.attachedFiles.find(
          (f) =>
            (f._id && f._id.toString() === targetId) ||
            f.publicId === targetId ||
            f.publicId === decodedTargetId ||
            (f.publicId && f.publicId.endsWith(targetId)) ||
            (targetId && f.publicId && targetId.endsWith(f.publicId))
        );
      }
    }

    // Search SocioLegalCounselling
    if (!targetFile) {
      const slcCase = await SocioLegalCounselling.findOne({ $or: queryConditions });
      if (slcCase && slcCase.attachedFiles) {
        targetFile = slcCase.attachedFiles.find(
          (f) =>
            (f._id && f._id.toString() === targetId) ||
            f.publicId === targetId ||
            f.publicId === decodedTargetId ||
            (f.publicId && f.publicId.endsWith(targetId)) ||
            (targetId && f.publicId && targetId.endsWith(f.publicId))
        );
      }
    }

    if (!targetFile) {
      return res.status(404).send('Document not found');
    }

    const fileUrl = targetFile.cloudinaryUrl || targetFile.fileUrl;
    if (!fileUrl) {
      return res.status(404).send('Document file URL is missing');
    }

    const isPdf =
      targetFile.fileType === 'application/pdf' ||
      targetFile.originalName?.toLowerCase().endsWith('.pdf') ||
      targetFile.title?.toLowerCase().endsWith('.pdf') ||
      targetFile.section === 'Advocate' ||
      targetFile.uploadedByRole === 'ADV' ||
      targetFile.documentType === 'Advocate Submission' ||
      fileUrl.toLowerCase().includes('.pdf') ||
      fileUrl.includes('/raw/upload/');

    const cleanTitle = (targetFile.title || targetFile.originalName || 'document')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = isPdf
      ? cleanTitle.endsWith('.pdf') ? cleanTitle : `${cleanTitle}.pdf`
      : targetFile.originalName || `${cleanTitle}.jpg`;

    const mimeType = isPdf
      ? 'application/pdf'
      : targetFile.fileType || 'application/octet-stream';

    // Set headers for INLINE viewing in browser tab (never trigger file download)
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Case A: Local disk storage fallback
    if (
      fileUrl.includes('/uploads/documents/') ||
      targetFile.resourceType === 'local' ||
      targetFile.publicId?.startsWith('local_')
    ) {
      const subPath = fileUrl.split('/uploads/')[1] || '';
      const localFilePath = path.join(process.cwd(), 'uploads', subPath);
      if (fs.existsSync(localFilePath)) {
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // Case B: Remote URL (Cloudinary)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return res
          .status(response.status)
          .send(`Failed to fetch file from storage: ${response.statusText}`);
      }

      const arrayBuf = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuf));
    }

    return res.status(404).send('Document source not accessible');
  } catch (error) {
    console.error('Error viewing document:', error);
    return res.status(500).send('Error viewing document: ' + error.message);
  }
};

