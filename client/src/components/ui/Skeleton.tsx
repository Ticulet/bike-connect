import './skeleton.css';

interface SkeletonProps {
  /** Variant: "text", "rect", "circle", "card". Default "rect". */
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string | number;
  height?: string | number;
  /** Number of repeated lines (text variant). Default 1. */
  lines?: number;
}

function buildStyle(
  width?: string | number,
  height?: string | number,
): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (width != null) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height != null) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  return style;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
}: SkeletonProps): React.JSX.Element {
  const className = `skeleton skeleton--${variant}`;
  const style = buildStyle(width, height);

  if (variant === 'text' && lines > 1) {
    return (
      <div
        role="status"
        aria-label="Loading…"
        className="skeleton__lines"
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={className}
            aria-hidden="true"
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading…">
      <span
        className={className}
        aria-hidden="true"
        style={style}
      />
    </div>
  );
}
