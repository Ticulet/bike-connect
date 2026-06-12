import { useRef, useState, useCallback } from 'react';
import { ALLOWED_IMAGE_TYPES, IMAGE_MAX_SIZE_BYTES } from '@bike-connect/shared';
import { useToast } from '../../../components/ui/useToast.js';
import './photo-gallery.css';

export interface ImageUploaderProps {
  onUpload: (url: string) => void;
  label?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'error' | 'dragover';

const MAX_FILE_SIZE_BYTES = IMAGE_MAX_SIZE_BYTES;
const ALLOWED_TYPES = new Set<string>(ALLOWED_IMAGE_TYPES);

export function ImageUploader({
  onUpload,
  label = 'Upload Photo',
}: ImageUploaderProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();

  function handleButtonClick(): void {
    inputRef.current?.click();
  }

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      if (!ALLOWED_TYPES.has(file.type)) {
        const msg = 'Only JPEG, PNG, and WebP images are allowed.';
        setErrorMessage(msg);
        setStatus('error');
        toast.error(msg);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const msg = 'Image too large (max 5 MB)';
        setErrorMessage(msg);
        setStatus('error');
        toast.error(msg);
        return;
      }

      setStatus('uploading');
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            typeof body === 'object' &&
            body !== null &&
            'message' in body &&
            typeof (body as Record<string, unknown>).message === 'string'
              ? (body as Record<string, string>).message
              : 'Upload failed. Please try again.';
          throw new Error(message);
        }

        const data = (await response.json()) as { url: string };
        setStatus('idle');
        onUpload(data.url);
        toast.success('Photo added');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    },
    [onUpload, toast],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = '';
      await uploadFile(file);
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setStatus('dragover');
  }, []);

  const handleDragLeave = useCallback((): void => {
    setStatus((prev) => prev === 'dragover' ? 'idle' : prev);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
      e.preventDefault();
      setStatus('idle');
      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const isUploading = status === 'uploading';
  const isDragOver = status === 'dragover';

  return (
    <div
      className={`image-uploader${isDragOver ? ' image-uploader--dragover' : ''}`}
      aria-busy={isUploading}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => void handleDrop(e)}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="image-uploader__input"
        aria-label={label}
        onChange={(e) => void handleFileChange(e)}
        disabled={isUploading}
      />
      <button
        type="button"
        className="image-uploader__btn"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : isDragOver ? 'Drop to upload' : label}
      </button>
      <p className="image-uploader__hint">
        Drop photos here, or click to browse
      </p>
      {isUploading && (
        <span className="image-uploader__status" aria-live="polite">
          Uploading image, please wait...
        </span>
      )}
      {status === 'error' && errorMessage !== null && (
        <span className="image-uploader__error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
