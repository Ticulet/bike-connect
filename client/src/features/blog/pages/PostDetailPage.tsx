import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import type { JSONContent } from '@tiptap/react';
import { fetchPostBySlug, type PostDetail } from '../api/posts.api.js';
import { PostContent } from '../components/PostContent.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './post-detail.css';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

export function PostDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    setIsLoading(true);
    setNotFound(false);
    setError(null);

    fetchPostBySlug(slug)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPost(result);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(
            err instanceof Error ? err.message : 'Failed to load post',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main id="main" className="post-detail-page">
        <p className="post-detail-page__loading" aria-live="polite">
          Loading post...
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main id="main" className="post-detail-page">
        <div className="post-detail-page__not-found">
          <h1>Post not found</h1>
          <p>The post you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main id="main" className="post-detail-page">
        <p className="post-detail-page__error" role="alert">
          {error ?? 'An unexpected error occurred.'}
        </p>
      </main>
    );
  }

  const displayDate = post.published_at ?? post.created_at;
  const authorInitial = post.author_display_name.charAt(0).toUpperCase();

  return (
    <main id="main" className="post-detail-page">
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={`Cover image for ${post.title}`}
          className="post-detail-page__cover"
        />
      )}

      <header className="post-detail-page__header">
        <span className="post-detail-page__category">
          {formatCategoryLabel(post.category)}
        </span>

        <h1 className="post-detail-page__title">{post.title}</h1>

        <div className="post-detail-page__meta">
          <div className="post-detail-page__author-info">
            {post.author_avatar_url ? (
              <img
                src={post.author_avatar_url}
                alt=""
                className="post-detail-page__avatar"
                aria-hidden="true"
              />
            ) : (
              <div
                className="post-detail-page__avatar-placeholder"
                aria-hidden="true"
              >
                {authorInitial}
              </div>
            )}
            <span className="post-detail-page__author-name">
              {post.author_display_name}
            </span>
          </div>

          <span className="post-detail-page__divider" aria-hidden="true">·</span>

          <time dateTime={displayDate}>{formatDate(displayDate)}</time>
        </div>

        {post.tags.length > 0 && (
          <ul className="post-detail-page__tags" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag.id} className="post-detail-page__tag">
                {tag.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="post-detail-page__body">
        <PostContent content={post.content as JSONContent} />
      </div>
    </main>
  );
}
