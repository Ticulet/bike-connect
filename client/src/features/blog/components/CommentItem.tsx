import { useState } from 'react';
import { Link } from 'react-router';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { Avatar } from '../../../components/ui/Avatar.js';
import { updateComment } from '../api/comments.api.js';
import type { CommentItem as CommentItemData } from '../api/comments.api.js';
import { CommentForm } from './CommentForm.js';
import './blog-social.css';

function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CommentItemProps {
  comment: CommentItemData;
  currentUserId: string | null;
  isAuthenticated: boolean;
  onDelete: (id: string) => void;
  onUpdated: (updated: CommentItemData) => void;
  onReply?: (parentId: string) => void;
  replyingToId?: string | null;
  onCancelReply?: () => void;
  postId: string;
  onReplySubmit?: (content: string, parentId: string) => Promise<void>;
}

export function CommentItem({
  comment,
  currentUserId,
  isAuthenticated,
  onDelete,
  onUpdated,
  onReply,
  replyingToId,
  onCancelReply,
  postId,
  onReplySubmit,
}: CommentItemProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const authorDisplayName = comment.author_display_name ?? 'Unknown';

  async function handleSaveEdit(): Promise<void> {
    const trimmed = editContent.trim();
    if (trimmed.length === 0) {
      setEditError('Comment cannot be empty.');
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      const updated = await updateComment(comment.id, trimmed);
      onUpdated(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to update comment.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit(): void {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditError(null);
  }

  return (
    <div className="comment-item">
      <Link
        to={`/users/${comment.user_id}`}
        className="comment-item__avatar-link"
        aria-label={`View ${authorDisplayName}'s profile`}
      >
        <Avatar
          src={comment.author_avatar_url}
          name={authorDisplayName}
          className="comment-item__avatar"
          fallbackClassName="comment-item__avatar-placeholder"
        />
      </Link>

      <div className="comment-item__body">
        <div className="comment-item__header">
          <Link to={`/users/${comment.user_id}`} className="comment-item__author">
            {authorDisplayName}
          </Link>
          <time
            className="comment-item__date"
            dateTime={comment.created_at}
            title={new Date(comment.created_at).toLocaleString()}
          >
            {formatCommentDate(comment.created_at)}
          </time>
        </div>

        {isEditing ? (
          <div className="comment-item__edit-form">
            <label htmlFor={`edit-${comment.id}`} className="sr-only">
              Edit comment
            </label>
            <textarea
              id={`edit-${comment.id}`}
              className={`comment-form__textarea${editError ? ' comment-form__textarea--error' : ''}`}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              aria-required="true"
              aria-invalid={editError !== null ? 'true' : undefined}
              disabled={isSaving}
            />
            {editError && (
              <p className="comment-form__error" role="alert">
                {editError}
              </p>
            )}
            <div className="comment-form__actions">
              <button
                type="button"
                className="comment-form__cancel-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="comment-form__submit-btn"
                onClick={() => void handleSaveEdit()}
                disabled={isSaving || editContent.trim().length === 0}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-item__content">{comment.content}</p>
        )}

        {!isEditing && (
          <div className="comment-item__actions">
            {isAuthenticated && onReply && (
              <button
                type="button"
                className="comment-item__action-btn"
                onClick={() => onReply(comment.id)}
                aria-label={`Reply to ${authorDisplayName}`}
              >
                Reply
              </button>
            )}
            {isOwner && (
              <>
                <button
                  type="button"
                  className="comment-item__action-btn"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit comment"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="comment-item__action-btn comment-item__action-btn--delete"
                  onClick={() => setShowDeleteDialog(true)}
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {replyingToId === comment.id && onReplySubmit && onCancelReply && (
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSubmit={(content) => onReplySubmit(content, comment.id)}
              onCancel={onCancelReply}
              placeholder={`Reply to ${authorDisplayName}…`}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          setShowDeleteDialog(false);
          onDelete(comment.id);
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
