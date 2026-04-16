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
import './blog-social.css';

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
        <p aria-live="polite" style={{ color: 'var(--color-text-muted)' }}>
          Loading comments…
        </p>
      ) : commentCount === 0 ? (
        <p className="comment-section__empty">No comments yet.</p>
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
