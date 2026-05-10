import './stat-strip.css';

interface StatItem {
  label: string;
  value: string | number;
  delta?: string;
}

interface StatStripProps {
  stats: StatItem[];
  orientation?: 'horizontal' | 'vertical';
}

export function StatStrip({ stats, orientation = 'horizontal' }: StatStripProps): React.JSX.Element {
  return (
    <dl className={`stat-strip stat-strip--${orientation}`} aria-label="Statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-strip__item">
          <dt className="stat-strip__label">{stat.label}</dt>
          <dd className="stat-strip__value">
            {stat.value}
            {stat.delta !== undefined && (
              <span className="stat-strip__delta">{stat.delta}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
