import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Use a dedicated temporary folder inside backend/uploads/temp or fallback to OS tempdir
const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Configure disk storage for Multer (stream directly to disk to prevent RAM blowups)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

// Allowed file types: JPEG/PNG images & PDFs
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/x-pdf',
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isValidExt = allowedExtensions.includes(ext);
  const isValidMime = allowedMimeTypes.includes(mime) || mime === 'application/octet-stream';

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type (${file.mimetype}). Only JPEG, PNG images and PDF documents are allowed.`
      ),
      false
    );
  }
};

// Limit: 2 GB (2147483648 bytes)
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // max 5 files per request
  },
});

// PDF-Only Filter for Advocate Documents
const pdfFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (
    ext === '.pdf' &&
    (mime === 'application/pdf' || mime === 'application/x-pdf' || mime === 'application/octet-stream')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents are allowed.'), false);
  }
};

export const pdfUpload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Safely delete a temporary file from disk
 * @param {string} filePath
 */
export const removeLocalFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn(`Warning: Could not remove temporary file: ${filePath}`, err.message);
  }
};
