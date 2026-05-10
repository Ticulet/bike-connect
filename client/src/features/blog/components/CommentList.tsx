import { useState, useEffect, useCallback } from 'react';
import {
  fetchComments,
  createComment,
  deleteComment,
  type CommentItem as CommentItemData,
} from '../api/comments.api.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { CommentForm } from './CommentForm.js';
import { CommentItem } from './CommentItem.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import './blog-social.css';

function CommentIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CommentListProps {
  postId: string;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

interface ThreadedComment {
  comment: CommentItemData;
  replies: CommentItemData[];
}

function buildThreads(comments: CommentItemData[]): ThreadedComment[] {
  const topLevel = comments.filter((c) => c.parent_id === null);
  const replies = comments.filter((c) => c.parent_id !== null);

  return topLevel.map((comment) => ({
    comment,
    replies: replies.filter((r) => r.parent_id === comment.id),
  }));
}

export function CommentList({
  postId,
  isAuthenticated,
  currentUserId,
}: CommentListProps): React.JSX.Element {
  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const loadComments = useCallback(
    (signal: AbortSignal): void => {
      setIsLoading(true);
      setError(null);

      fetchComments(postId)
        .then((data) => {
          if (!signal.aborted) {
            setComments(data);
          }
        })
        .catch((err: unknown) => {
          if (signal.aborted) return;
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'Failed to load comments.',
          );
        })
        .finally(() => {
          if (!signal.aborted) {
            setIsLoading(false);
          }
        });
    },
    [postId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadComments(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadComments]);

  async function handleSubmitComment(content: string): Promise<void> {
    const created = await createComment(postId, content, null);
    setComments((prev) => [...prev, created]);
  }

  async function handleSubmitReply(content: string, parentId: string): Promise<void> {
    const created = await createComment(postId, content, parentId);
    setComments((prev) => [...prev, created]);
    setReplyingToId(null);
  }

  function handleDeleteComment(id: string): void {
    deleteComment(id)
      .then(() => {
        setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Failed to delete comment.',
        );
      });
  }

  function handleUpdatedComment(updated: CommentItemData): void {
    setComments((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  const commentCount = comments.length;
  const threads = buildThreads(comments);

  return (
    <section aria-label="Comments" className="comment-section">
      <h2 className="comment-section__heading">
        {commentCount === 0
          ? 'Comments'
          : `${commentCount.toLocaleString()} Comment${commentCount === 1 ? '' : 's'}`}
      </h2>

      {isAuthenticated ? (
        <CommentForm
          postId={postId}
          onSubmit={handleSubmitComment}
          placeholder="Share your thoughts…"
        />
      ) : (
        <p className="comment-section__auth-prompt">
          Log in to leave a comment.
        </p>
      )}

      {error && (
        <p className="comment-form__error" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="comment-section__skeleton" role="status" aria-live="polite" aria-label="Loading comments…">
          <Skeleton variant="text" width="60%" height="1rem" />
          <Skeleton variant="text" width="85%" height="0.875rem" />
          <Skeleton variant="text" width="40%" height="0.875rem" />
        </div>
      ) : commentCount === 0 ? (
        <EmptyState
          icon={<CommentIcon />}
          title="No comments yet"
          description="Be the first to share your thoughts."
        />
      ) : (
        <ul className="comment-section__list" aria-label="Comments list">
          {threads.map(({ comment, replies }) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                onDelete={handleDeleteComment}
                onUpdated={handleUpdatedComment}
                onReply={(id) =>
                  setReplyingToId((prev) => (prev === id ? null : id))
                }
                replyingToId={replyingToId}
                onCancelReply={() => setReplyingToId(null)}
                postId={postId}
                onReplySubmit={handleSubmitReply}
              />
              {replies.length > 0 && (
                <ul
                  className="comment-section__replies"
                  aria-label={`Replies to ${comment.author_display_name}`}
                >
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentItem
                        comment={reply}
                        currentUserId={currentUserId}
                        isAuthenticated={isAuthenticated}
                        onDelete={handleDeleteComment}
                        onUpdated={handleUpdatedComment}
                        postId={postId}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
