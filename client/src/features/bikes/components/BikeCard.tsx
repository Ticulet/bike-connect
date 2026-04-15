import { Link } from 'react-router';
import type { BikeItem } from '../api/bikes.api.js';
import './bikes.css';

interface BikeCardProps {
  bike: BikeItem;
}

export function BikeCard({ bike }: BikeCardProps): React.JSX.Element {
  return (
    <article className="bike-card">
      <Link
        to={`/my-bikes/${bike.id}`}
        className="bike-card__link"
        aria-label={`View ${bike.name}`}
      >
        {bike.hero_image_url ? (
          <img
            className="bike-card__image"
            src={bike.hero_image_url}
            alt={`${bike.name} hero image`}
            loading="lazy"
          />
        ) : (
          <div className="bike-card__image-placeholder" aria-hidden="true">
            🚲
          </div>
        )}
      </Link>

      <div className="bike-card__body">
        <div className="bike-card__header">
          <h2 className="bike-card__name">
            <Link
              to={`/my-bikes/${bike.id}`}
              className="bike-card__name-link"
            >
              {bike.name}
            </Link>
          </h2>
          <div className="bike-card__badges">
            <span className="bike-card__badge bike-card__badge--type">
              {bike.type}
            </span>
            <span
              className={`bike-card__badge ${bike.is_public ? 'bike-card__badge--public' : 'bike-card__badge--private'}`}
              aria-label={bike.is_public ? 'Public bike' : 'Private bike'}
            >
              {bike.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        <p className="bike-card__subtitle">
          {bike.brand} {bike.model} &mdash; {bike.year}
        </p>
      </div>
    </article>
  );
}
