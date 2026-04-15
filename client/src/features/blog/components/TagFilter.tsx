import { useState, useEffect } from 'react';
import { fetchTags, type TagItem } from '../api/posts.api.js';

interface TagFilterProps {
  selected: string | null;
  onChange: (tagSlug: string | null) => void;
}

export function TagFilter({ selected, onChange }: TagFilterProps): React.JSX.Element {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchTags()
      .then((result) => {
        if (!controller.signal.aborted) {
          setTags(result);
        }
      })
      .catch(() => {
        // Silently ignore tag fetch errors — filter remains hidden
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  if (isLoading || tags.length === 0) {
    return <></>;
  }

  return (
    <div aria-label="Filter posts by tag" role="group">
      <ul
        role="list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {tags.map((tag) => (
          <li key={tag.id}>
            <button
              type="button"
              onClick={() => onChange(selected === tag.slug ? null : tag.slug)}
              aria-pressed={selected === tag.slug}
              className={`tag-filter__chip${selected === tag.slug ? ' tag-filter__chip--active' : ''}`}
            >
              {tag.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
