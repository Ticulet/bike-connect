import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { PostCategory } from '@bike-connect/shared';
import { usePosts } from '../hooks/usePosts.js';
import { PostCard } from '../components/PostCard.js';
import { CategoryFilter } from '../components/CategoryFilter.js';
import { TagFilter } from '../components/TagFilter.js';
import { SearchBar } from '../components/SearchBar.js';
import type { PostSummary } from '../api/posts.api.js';
import './post-list.css';
import '../components/blog-social.css';

export function PostListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<PostSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const category = (searchParams.get('category') as PostCategory) ?? null;
  const tag = searchParams.get('tag') ?? null;

  const { posts, isLoading, hasMore, loadMore, error } = usePosts({
    category: category ?? undefined,
    tag: tag ?? undefined,
  });

  const handleSearchResults = useCallback((results: PostSummary[]): void => {
    setSearchResults(results);
  }, []);

  const handleSearchClear = useCallback((): void => {
    setSearchResults(null);
    setSearchQuery('');
  }, []);

  const handleSearchQuery = useCallback((q: string): void => {
    setSearchQuery(q);
  }, []);

  function handleCategoryChange(next: PostCategory | null): void {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (next) {
        updated.set('category', next);
      } else {
        updated.delete('category');
      }
      // Reset tag when category changes
      updated.delete('tag');
      return updated;
    });
  }

  function handleTagChange(tagSlug: string | null): void {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (tagSlug) {
        updated.set('tag', tagSlug);
      } else {
        updated.delete('tag');
      }
      return updated;
    });
  }

  const isSearchMode = searchResults !== null;

  return (
    <main id="main" className="post-list-page">
      <h1 className="post-list-page__heading">Blog</h1>

      <SearchBar
        onResults={handleSearchResults}
        onClear={handleSearchClear}
        onQuery={handleSearchQuery}
      />

      {!isSearchMode && (
        <div className="post-list-page__filters">
          <CategoryFilter selected={category} onChange={handleCategoryChange} />
          <TagFilter selected={tag} onChange={handleTagChange} />
        </div>
      )}

      {isSearchMode ? (
        <section aria-label="Search results" aria-live="polite">
          <h2 className="search-results__heading">
            Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          {searchResults.length === 0 ? (
            <p className="search-results__empty">No posts found.</p>
          ) : (
            <ul role="list" className="post-list-page__grid">
              {searchResults.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {error && (
            <p className="post-list-page__error" role="alert">
              {error}
            </p>
          )}

          <section aria-label="Blog posts" aria-live="polite" aria-busy={isLoading}>
            {posts.length === 0 && !isLoading && !error ? (
              <ul role="list" className="post-list-page__grid">
                <li className="post-list-page__empty">No posts found.</li>
              </ul>
            ) : (
              <ul role="list" className="post-list-page__grid">
                {posts.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            )}

            {isLoading && (
              <div className="post-list-page__loading" aria-label="Loading posts">
                Loading...
              </div>
            )}
          </section>

          {hasMore && !isLoading && (
            <div className="post-list-page__footer">
              <button
                type="button"
                className="post-list-page__load-more"
                onClick={loadMore}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
