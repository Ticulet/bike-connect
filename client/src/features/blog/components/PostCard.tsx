import { Link } from 'react-router';
import type { PostSummary } from '../api/posts.api.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import { CoverImage } from './CoverImage.js';
import './post-card.css';

interface PostCardProps {
  post: PostSummary;
  /**
   * Visual size variant.
   * - "featured": full-width, large title (display-sm), drop-cap option, cover image left on desktop
   * - "medium": image top, title + excerpt. Title at 3xl.
   * - "compact": image strip or none, title + meta only (no excerpt). Title at xl.
   * Defaults to "medium" to match prior default behaviour.
   */
  variant?: 'featured' | 'medium' | 'compact';
  /** Enable drop cap on the excerpt (featured variant only). */
  dropCap?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

export function PostCard({ post, variant = 'medium', dropCap = false }: PostCardProps): React.JSX.Element {
  const displayDate = post.published_at ?? post.created_at;
  const authorInitial = post.author_display_name.charAt(0).toUpperCase();
  const showExcerpt = variant !== 'compact';
  const showCategory = variant !== 'compact';
  const articleClass = [
    'post-card',
    `post-card--${variant}`,
    dropCap && variant === 'featured' ? 'has-drop-cap' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={articleClass}>
      {isSafeImageUrl(post.cover_image_url) && (
        <CoverImage
          src={post.cover_image_url}
          alt={`Cover image for ${post.title}`}
          className="post-card__cover"
        />
      )}
      <div className="post-card__body">
        <div className="post-card__meta">
          {showCategory && (
            <span className="post-card__category" aria-label={`Category: ${formatCategoryLabel(post.category)}`}>
              {formatCategoryLabel(post.category)}
            </span>
          )}
          {showCategory && (
            <span className="post-card__meta-sep" aria-hidden="true">·</span>
          )}
          <time className="post-card__date" dateTime={displayDate}>
            {formatDate(displayDate)}
          </time>
        </div>

        <h2 className="post-card__title">
          <Link to={`/posts/${post.slug}`} className="post-card__title-link">
            {post.title}
          </Link>
        </h2>

        {showExcerpt && post.excerpt && (
          <p className="post-card__excerpt">
            {post.excerpt}
          </p>
        )}

        <Link
          to={`/users/${post.author_id}`}
          className="post-card__author"
          aria-label={`View ${post.author_display_name}'s profile`}
        >
          {isSafeImageUrl(post.author_avatar_url) ? (
            <img
              src={post.author_avatar_url}
              alt=""
              className="post-card__avatar"
              aria-hidden="true"
            />
          ) : (
            <div className="post-card__avatar-placeholder" aria-hidden="true">
              {authorInitial}
            </div>
          )}
          <span className="post-card__author-name">{post.author_display_name}</span>
        </Link>
      </div>
    </article>
  );
}
