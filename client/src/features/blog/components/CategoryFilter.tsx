import { POST_CATEGORIES, type PostCategory } from '@bike-connect/shared';

interface CategoryFilterProps {
  selected: PostCategory | null;
  onChange: (category: PostCategory | null) => void;
}

function formatLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps): React.JSX.Element {
  return (
    <nav aria-label="Filter posts by category">
      <ul
        role="list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        <li>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-pressed={selected === null}
            className={`category-filter__btn${selected === null ? ' category-filter__btn--active' : ''}`}
          >
            All
          </button>
        </li>
        {POST_CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              onClick={() => onChange(category)}
              aria-pressed={selected === category}
              className={`category-filter__btn${selected === category ? ' category-filter__btn--active' : ''}`}
            >
              {formatLabel(category)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
