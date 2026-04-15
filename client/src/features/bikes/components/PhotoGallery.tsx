import { ImageUploader } from './ImageUploader.js';
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
  function handleUpload(url: string): void {
    onHeroChange?.(url);
  }

  return (
    <div className="photo-gallery">
      {heroImageUrl ? (
        <img
          className="photo-gallery__hero"
          src={heroImageUrl}
          alt={`${bikeName} hero image`}
          loading="lazy"
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
