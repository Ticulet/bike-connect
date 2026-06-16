import { useState } from 'react';
import { ImageUploader } from './ImageUploader.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import './photo-gallery.css';

interface PhotoGalleryProps {
  heroImageUrl: string | null;
  isOwner: boolean;
  bikeName: string;
  onHeroChange?: (url: string) => void;
}

export function PhotoGallery({
  heroImageUrl,
  isOwner,
  bikeName,
  onHeroChange,
}: PhotoGalleryProps): React.JSX.Element {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // A safe URL whose image fails to load (e.g. a bike-photos file not dropped
  // in yet) is treated the same as no photo, so the placeholder shows instead
  // of a broken image.
  const heroSrc = isSafeImageUrl(heroImageUrl) ? heroImageUrl : null;

  function handleUpload(url: string): void {
    onHeroChange?.(url);
  }

  return (
    <div className="photo-gallery">
      {heroSrc !== null && heroSrc !== failedSrc ? (
        <img
          className="photo-gallery__hero"
          src={heroSrc}
          alt={`${bikeName} hero image`}
          loading="lazy"
          onError={() => setFailedSrc(heroSrc)}
        />
      ) : (
        <div
          className="photo-gallery__placeholder"
          aria-label="No photo available"
          role="img"
        >
          <span aria-hidden="true">🚲</span>
          <span className="photo-gallery__placeholder-text">No photo yet</span>
        </div>
      )}

      {isOwner && (
        <div className="photo-gallery__upload">
          <ImageUploader
            onUpload={handleUpload}
            label={heroImageUrl ? 'Replace hero photo' : 'Upload hero photo'}
          />
        </div>
      )}
    </div>
  );
}
