import { useState, useEffect, useRef } from 'react';
import type { PostSummary } from '../api/posts.api.js';
import { searchPosts } from '../api/search.api.js';
import './blog-social.css';

interface SearchBarProps {
  onResults: (posts: PostSummary[]) => void;
  onClear: () => void;
  onQuery: (q: string) => void;
}

const DEBOUNCE_MS = 300;

export function SearchBar({ onResults, onClear, onQuery }: SearchBarProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      // Clear state when input emptied
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      abortRef.current?.abort();
      abortRef.current = null;
      setIsSearching(false);
      onClear();
      onQuery('');
      return;
    }

    if (trimmed.length < 1) return;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      onQuery(trimmed);

      searchPosts(trimmed)
        .then((results) => {
          if (!controller.signal.aborted) {
            onResults(results);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            onResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return undefined;
  }, [query, onResults, onClear, onQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  function handleClear(): void {
    setQuery('');
  }

  return (
    <div className="search-bar" role="search">
      <div className="search-bar__input-wrap">
        <label htmlFor="post-search-input" className="sr-only">
          Search posts
        </label>
        <input
          id="post-search-input"
          type="search"
          className="search-bar__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts…"
          maxLength={200}
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            type="button"
            className="search-bar__clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      {isSearching && (
        <span className="search-bar__loading" aria-live="polite" aria-atomic="true">
          Searching…
        </span>
      )}
    </div>
  );
}
