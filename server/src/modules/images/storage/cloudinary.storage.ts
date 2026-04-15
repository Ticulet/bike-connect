import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../../../lib/api-error.js';
import type { ImageStorage, UploadResult } from './storage.interface.js';

cloudinary.config({ secure: true });

export class CloudinaryStorage implements ImageStorage {
  async upload(file: Express.Multer.File): Promise<UploadResult> {
    try {
      const base64 = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'bike-connect',
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (err) {
      throw new ApiError(502, 'STORAGE_ERROR', 'Image storage service unavailable');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // Ignore errors on delete — best-effort cleanup
    }
  }
}
