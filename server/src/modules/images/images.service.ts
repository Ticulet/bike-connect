import { env } from '../../config/env.js';
import { CloudinaryStorage } from './storage/cloudinary.storage.js';
import { LocalStorage } from './storage/local.storage.js';
import type { ImageStorage } from './storage/storage.interface.js';

function createStorage(): ImageStorage {
  if (env.IMAGE_STORAGE === 'cloudinary') {
    return new CloudinaryStorage();
  }
  return new LocalStorage(env.LOCAL_UPLOAD_DIR);
}

export const imageStorage = createStorage();
