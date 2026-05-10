import { useId } from 'react';
import './sparkline.css';

interface SparklineProps {
  /** Array of numeric values (one per period). */
  data: number[];
  /** SVG height in px. Default 48. */
  height?: number;
  /** Accessible label (screen reader, figcaption). */
  ariaLabel: string;
}

export function Sparkline({ data, height = 48, ariaLabel }: SparklineProps): React.JSX.Element | null {
  const titleId = useId();

  // Drop NaN / Infinity before computing min/max — a single bad value would
  // poison the entire chart (NaN propagates through min, max, ratio, point).
  const validData = data.filter((v) => Number.isFinite(v));
  if (validData.length === 0) return null;

  const width = 240; // intrinsic; stretches via CSS
  const paddingX = 4;
  const paddingY = 4;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1; // avoid divide-by-zero

  const stepX = (width - paddingX * 2) / Math.max(validData.length - 1, 1);

  function xAt(index: number): number {
    return paddingX + index * stepX;
  }

  function yAt(value: number): number {
    // Flip: larger value → higher on SVG (smaller y)
    return paddingY + (1 - (value - min) / range) * (height - paddingY * 2);
  }

  const points = validData.map((v, i) => `${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`).join(' ');

  const minIndex = validData.indexOf(min);
  const maxIndex = validData.indexOf(max);

  // Three horizontal grid lines at min / mid / max value levels
  const gridYMin = yAt(min);
  const gridYMax = yAt(max);
  const gridYMid = yAt((min + max) / 2);

  return (
    <figure className="sparkline">
      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="sparkline__svg"
      >
        <title id={titleId}>{ariaLabel}</title>

        {/* Grid lines */}
        <line x1={paddingX} x2={width - paddingX} y1={gridYMin} y2={gridYMin} className="sparkline__grid" />
        <line x1={paddingX} x2={width - paddingX} y1={gridYMid} y2={gridYMid} className="sparkline__grid" />
        <line x1={paddingX} x2={width - paddingX} y1={gridYMax} y2={gridYMax} className="sparkline__grid" />

        {/* Polyline */}
        <polyline
          points={points}
          className="sparkline__line"
          fill="none"
        />

        {/* Min dot */}
        <circle
          cx={xAt(minIndex)}
          cy={yAt(min)}
          r="2"
          className="sparkline__dot"
        />

        {/* Max dot */}
        <circle
          cx={xAt(maxIndex)}
          cy={yAt(max)}
          r="2"
          className="sparkline__dot"
        />
      </svg>

      <figcaption className="sr-only">{ariaLabel}</figcaption>
    </figure>
  );
}
