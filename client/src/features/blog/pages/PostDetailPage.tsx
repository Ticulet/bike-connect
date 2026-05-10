import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import type { JSONContent } from '@tiptap/react';
import { fetchPostBySlug, fetchPosts, type PostDetail, type PostSummary } from '../api/posts.api.js';
import { PostContent } from '../components/PostContent.js';
import { PostCard } from '../components/PostCard.js';
import { LikeButton } from '../components/LikeButton.js';
import { BookmarkButton } from '../components/BookmarkButton.js';
import { CommentList } from '../components/CommentList.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import './post-detail.css';
import '../components/blog-social.css';

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

/** Estimate reading time — 1000 chars ≈ 1 minute. */
function estimateReadingTime(content: Record<string, unknown>): number {
  const text = JSON.stringify(content);
  return Math.max(1, Math.ceil(text.length / 1000));
}

export function PostDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [moreFromAuthor, setMoreFromAuthor] = useState<PostSummary[]>([]);
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
          // Fetch "more from author" — best-effort, no error surfaced
          void fetchPosts({ author: result.author_id, limit: 4 })
            .then((res) => {
              if (!controller.signal.aborted) {
                setMoreFromAuthor(res.data.filter(p => p.id !== result.id).slice(0, 3));
              }
            })
            .catch(() => { /* hide gracefully */ });
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

  const readingTime = useMemo(() => {
    if (!post) return 0;
    return estimateReadingTime(post.content as Record<string, unknown>);
  }, [post]);

  if (isLoading) {
    return (
      <div className="post-detail">
        <div className="post-detail__loading" aria-live="polite">
          <Skeleton variant="rect" height={320} />
          <div className="post-detail__loading-body">
            <Skeleton variant="text" lines={3} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="post-detail">
        <div className="post-detail__not-found">
          <h1>Post not found</h1>
          <p>The post you are looking for does not exist.</p>
          <Link to="/posts" className="btn btn-primary">Back to blog</Link>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail">
        <p className="post-detail__error" role="alert">
          {error ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  const displayDate = post.published_at ?? post.created_at;
  const authorInitial = post.author_display_name.charAt(0).toUpperCase();

  return (
    <article className="post-detail">
      {/* Full-bleed cover */}
      {isSafeImageUrl(post.cover_image_url) && (
        <figure className="post-detail__cover">
          <img
            src={post.cover_image_url}
            alt={`Cover image for ${post.title}`}
            className="post-detail__cover-img"
            loading="eager"
          />
        </figure>
      )}

      {/* Article header */}
      <header className="post-detail__header">
        <p className="post-detail__eyebrow">
          {formatCategoryLabel(post.category)}
        </p>
        <h1 className="post-detail__title display-cover">{post.title}</h1>
        <div className="post-detail__meta">
          <time dateTime={displayDate}>{formatDate(displayDate)}</time>
          <span aria-hidden="true">&middot;</span>
          <span>{readingTime} min read</span>
        </div>

        {post.tags.length > 0 && (
          <ul className="post-detail__tags" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag.id} className="post-detail__tag">
                {tag.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* Two-column layout: sticky author rail + article body */}
      <div className="post-detail__layout">
        <aside className="post-detail__author-rail" aria-label="About the author">
          <Link
            to={`/users/${post.author_id}`}
            className="post-detail__author-link"
            aria-label={`View ${post.author_display_name}'s profile`}
          >
            {isSafeImageUrl(post.author_avatar_url) ? (
              <img
                src={post.author_avatar_url}
                alt=""
                className="post-detail__author-avatar"
                aria-hidden="true"
              />
            ) : (
              <div className="post-detail__author-avatar-fallback" aria-hidden="true">
                {authorInitial}
              </div>
            )}
            <p className="post-detail__author-name">{post.author_display_name}</p>
          </Link>
          <div className="post-detail__social">
            <LikeButton postId={post.id} isAuthenticated={isAuthenticated} />
            <BookmarkButton postId={post.id} isAuthenticated={isAuthenticated} />
          </div>
        </aside>

        <div className="post-detail__body prose post-detail__body--drop-cap">
          <PostContent content={post.content as JSONContent} />
        </div>
      </div>

      {/* More from this author */}
      {moreFromAuthor.length > 0 && (
        <section className="post-detail__more" aria-labelledby="more-from-author">
          <h2 id="more-from-author" className="section-heading">
            More from {post.author_display_name}
          </h2>
          <div className="post-detail__more-grid">
            {moreFromAuthor.map((p) => (
              <PostCard key={p.id} post={p} variant="compact" />
            ))}
          </div>
        </section>
      )}

      <CommentList
        postId={post.id}
        isAuthenticated={isAuthenticated}
        currentUserId={user?.id ?? null}
      />
    </article>
  );
}
