interface CoverImageProps {
  /** The WebP (universal fallback) URL, e.g. /blog-covers/<slug>.webp */
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Renders a cover image. For local covers (which ship as both
 * /blog-covers/<slug>.webp and .avif) it offers an AVIF <source> for browsers
 * that support it, with the WebP <img> as the universal fallback. For any other
 * URL it renders a plain <img>.
 */
export function CoverImage({
  src,
  alt,
  className,
  loading = 'lazy',
}: CoverImageProps): React.JSX.Element {
  const avifSrc =
    src.startsWith('/blog-covers/') && src.endsWith('.webp')
      ? src.replace(/\.webp$/, '.avif')
      : null;

  if (avifSrc === null) {
    return <img src={src} alt={alt} className={className} loading={loading} />;
  }

  return (
    <picture>
      <source srcSet={avifSrc} type="image/avif" />
      <img src={src} alt={alt} className={className} loading={loading} />
    </picture>
  );
}
