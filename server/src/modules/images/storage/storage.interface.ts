export interface UploadResult {
  url: string;
  public_id?: string;
}

export interface ImageStorage {
  upload(file: Express.Multer.File): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
