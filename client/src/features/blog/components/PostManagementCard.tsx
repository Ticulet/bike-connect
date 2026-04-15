import { Link } from 'react-router';
import type { PostSummary } from '../api/posts.api.js';

interface PostManagementCardProps {
  post: PostSummary;
  onPublishToggle: (postId: string, newStatus: 'draft' | 'published') => void;
  onDelete: (postId: string) => void;
  isUpdating: boolean;
}

export function PostManagementCard({
  post,
  onPublishToggle,
  onDelete,
  isUpdating,
}: PostManagementCardProps): React.JSX.Element {
  const isDraft = post.status === 'draft';
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString()
    : new Date(post.created_at).toLocaleDateString();

  return (
    <article className="mgmt-card">
      <div className="mgmt-card__header">
        <h3 className="mgmt-card__title">
          <Link to={isDraft ? `/posts/${post.id}/edit` : `/posts/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        <span
          className={`mgmt-card__badge mgmt-card__badge--${post.status}`}
          aria-label={`Status: ${post.status}`}
        >
          {post.status}
        </span>
      </div>

      {post.excerpt && (
        <p className="mgmt-card__excerpt">{post.excerpt}</p>
      )}

      <div className="mgmt-card__meta">
        <span className="mgmt-card__category">
          {post.category.replace(/_/g, ' ')}
        </span>
        <time className="mgmt-card__date" dateTime={post.published_at ?? post.created_at}>
          {isDraft ? 'Created' : 'Published'}: {formattedDate}
        </time>
      </div>

      <div className="mgmt-card__actions">
        <Link to={`/posts/${post.id}/edit`} className="mgmt-card__btn">
          Edit
        </Link>
        <button
          type="button"
          className="mgmt-card__btn"
          onClick={() => onPublishToggle(post.id, isDraft ? 'published' : 'draft')}
          disabled={isUpdating}
        >
          {isDraft ? 'Publish' : 'Unpublish'}
        </button>
        <button
          type="button"
          className="mgmt-card__btn mgmt-card__btn--danger"
          onClick={() => onDelete(post.id)}
          disabled={isUpdating}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
