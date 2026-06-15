import { useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router';
import type { PostCategory } from '@bike-connect/shared';
import { usePosts } from '../hooks/usePosts.js';
import { PostCard } from '../components/PostCard.js';
import { CategoryFilter } from '../components/CategoryFilter.js';
import { TagFilter } from '../components/TagFilter.js';
import { SearchBar } from '../components/SearchBar.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import type { PostSummary } from '../api/posts.api.js';
import './post-list.css';
import '../components/blog-social.css';

// The list promotes the first three posts out of the grid (one featured card
// plus two secondary cards), then renders the rest in a three-column grid.
// Keeping the page size a multiple of three means the grid always fills
// complete rows: 12 - 3 = 9 on the first page, then +12 on each "Load more".
const POSTS_PER_PAGE = 12;

function PenEmptyIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="21" x2="27" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="26" x2="21" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PostListSkeleton(): React.JSX.Element {
  return (
    <div className="post-list__skeletons" aria-busy="true" aria-label="Loading posts">
      <div className="post-list__featured-skeleton">
        <Skeleton variant="card" height={360} />
      </div>
      <div className="post-list__secondary-skeleton">
        <Skeleton variant="card" height={240} />
        <Skeleton variant="card" height={240} />
      </div>
      <div className="post-list__grid-skeleton">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="card" height={180} />
        ))}
      </div>
    </div>
  );
}

export function PostListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<PostSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const category = (searchParams.get('category') as PostCategory) ?? null;
  const tag = searchParams.get('tag') ?? null;

  const { posts, isLoading, hasMore, loadMore, error } = usePosts({
    category: category ?? undefined,
    tag: tag ?? undefined,
    limit: POSTS_PER_PAGE,
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
    <div className="post-list">
      <PageHeader
        eyebrow="Field journal"
        title="Read"
        subtitle="Stories from the road, the workshop, and everywhere between."
        variant="editorial"
      />

      <div className="post-list__filters" data-sticky="true">
        <SearchBar
          onResults={handleSearchResults}
          onClear={handleSearchClear}
          onQuery={handleSearchQuery}
        />
        {!isSearchMode && (
          <>
            <CategoryFilter selected={category} onChange={handleCategoryChange} />
            <TagFilter selected={tag} onChange={handleTagChange} />
          </>
        )}
      </div>

      {isSearchMode ? (
        <section aria-label="Search results" aria-live="polite" className="post-list__search-results">
          <h2 className="post-list__search-heading">
            Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          {searchResults.length === 0 ? (
            <EmptyState
              icon={<PenEmptyIcon />}
              title="No results"
              description={`No posts found for "${searchQuery}". Try different keywords.`}
            />
          ) : (
            <ul role="list" className="post-list__grid">
              {searchResults.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} variant="compact" />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {error && (
            <p className="post-list__error" role="alert">
              {error}
            </p>
          )}

          <section aria-label="Blog posts" aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <PostListSkeleton />
            ) : posts.length === 0 && !error ? (
              <EmptyState
                icon={<PenEmptyIcon />}
                title="No stories yet"
                description="Check back soon, or explore bikes while you wait."
                action={<Link to="/explore/bikes" className="btn btn-primary">Explore bikes</Link>}
              />
            ) : (
              <>
                {posts.length > 0 && posts[0] != null && (
                  <article className="post-list__featured">
                    <PostCard post={posts[0]} variant="featured" />
                  </article>
                )}
                {posts.length > 1 && (
                  <div className="post-list__secondary">
                    {posts.slice(1, 3).map((p) => (
                      <PostCard key={p.id} post={p} variant="medium" />
                    ))}
                  </div>
                )}
                {posts.length > 3 && (
                  <div className="post-list__grid">
                    {posts.slice(3).map((p) => (
                      <PostCard key={p.id} post={p} variant="compact" />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {hasMore && !isLoading && (
            <div className="post-list__footer">
              <button
                type="button"
                className="btn btn-ghost post-list__load-more"
                onClick={loadMore}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
