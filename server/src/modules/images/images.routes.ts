import { Router } from 'express';
import multer from 'multer';
import { IMAGE_MAX_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@bike-connect/shared';
import { requireAuth } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rate-limit.js';
import { ApiError } from '../../lib/api-error.js';
import * as imagesController from './images.controller.js';

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed: readonly string[] = ALLOWED_IMAGE_TYPES;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'INVALID_FILE_TYPE', `File type not supported. Allowed: ${allowed.join(', ')}`));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_SIZE_BYTES },
  fileFilter,
});

export const imagesRouter = Router();

imagesRouter.post('/upload', requireAuth, uploadLimiter, upload.single('image'), imagesController.upload);
