import { useRef, useState } from 'react';
import './photo-gallery.css';

export interface ImageUploaderProps {
  onUpload: (url: string) => void;
  label?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'error';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({
  onUpload,
  label = 'Upload Photo',
}: ImageUploaderProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleButtonClick(): void {
    inputRef.current?.click();
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected after an error
    event.target.value = '';

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      setErrorMessage('Only JPEG, PNG, and WebP images are allowed.');
      setStatus('error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File exceeds 5 MB limit. Please choose a smaller image.');
      setStatus('error');
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  }

  const isUploading = status === 'uploading';

  return (
    <div className="image-uploader" aria-busy={isUploading}>
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
        aria-label={label}
      >
        {isUploading ? 'Uploading...' : label}
      </button>
      {isUploading && (
        <span className="image-uploader__status" aria-live="polite">
          Uploading image, please wait...
        </span>
      )}
      {status === 'error' && errorMessage && (
        <span
          className="image-uploader__error"
          role="alert"
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}
