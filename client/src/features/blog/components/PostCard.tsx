import { Link } from 'react-router';
import type { PostSummary } from '../api/posts.api.js';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import './post-card.css';

interface PostCardProps {
  post: PostSummary;
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

export function PostCard({ post }: PostCardProps): React.JSX.Element {
  const displayDate = post.published_at ?? post.created_at;
  const authorInitial = post.author_display_name.charAt(0).toUpperCase();

  return (
    <article className="post-card">
      {isSafeImageUrl(post.cover_image_url) && (
        <img
          src={post.cover_image_url}
          alt={`Cover image for ${post.title}`}
          className="post-card__cover"
          loading="lazy"
        />
      )}
      <div className="post-card__body">
        <div className="post-card__meta">
          <span className="post-card__category" aria-label={`Category: ${formatCategoryLabel(post.category)}`}>
            {formatCategoryLabel(post.category)}
          </span>
          <time className="post-card__date" dateTime={displayDate}>
            {formatDate(displayDate)}
          </time>
        </div>

        <h2 className="post-card__title">
          <Link to={`/posts/${post.slug}`} className="post-card__title-link">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="post-card__excerpt">{post.excerpt}</p>
        )}

        <div className="post-card__author">
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
        </div>
      </div>
    </article>
  );
}
