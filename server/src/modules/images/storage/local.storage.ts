import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ImageStorage, UploadResult } from './storage.interface.js';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export class LocalStorage implements ImageStorage {
  private readonly resolvedDir: string;

  constructor(uploadDir: string) {
    this.resolvedDir = path.resolve(uploadDir);
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    await mkdir(this.resolvedDir, { recursive: true });

    const extension = MIME_TO_EXT[file.mimetype] ?? '.bin';
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(this.resolvedDir, filename);

    await writeFile(filePath, file.buffer);

    return { url: '/uploads/' + filename };
  }

  async delete(publicId: string): Promise<void> {
    try {
      await unlink(path.join(this.resolvedDir, publicId));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }
}
