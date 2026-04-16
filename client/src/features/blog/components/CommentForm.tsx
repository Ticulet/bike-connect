import { useState, useId } from 'react';
import { VALIDATION_LIMITS } from '@bike-connect/shared';
import './blog-social.css';

const MAX_LENGTH = VALIDATION_LIMITS.COMMENT_CONTENT_MAX;
const NEAR_LIMIT_THRESHOLD = MAX_LENGTH - 200;

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment…',
}: CommentFormProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formId = useId();
  const textareaId = `${formId}-textarea`;
  const errorId = `${formId}-error`;
  const counterId = `${formId}-counter`;

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isNearLimit = charCount >= NEAR_LIMIT_THRESHOLD && !isOverLimit;
  const isAtLimit = charCount >= MAX_LENGTH;

  let counterClass = 'comment-form__counter';
  if (isAtLimit) counterClass += ' comment-form__counter--at-limit';
  else if (isNearLimit) counterClass += ' comment-form__counter--near-limit';

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      setError('Comment cannot be empty.');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Comment must be at most ${MAX_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent('');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to post comment. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <label htmlFor={textareaId} className="comment-form__label">
        {onCancel ? 'Reply' : 'Leave a comment'}
      </label>
      <textarea
        id={textareaId}
        className={`comment-form__textarea${error ? ' comment-form__textarea--error' : ''}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_LENGTH}
        aria-required="true"
        aria-describedby={`${counterId}${error ? ` ${errorId}` : ''}`}
        aria-invalid={error !== null ? 'true' : undefined}
        disabled={isSubmitting}
        rows={4}
      />
      <div className="comment-form__footer">
        <span
          id={counterId}
          className={counterClass}
          aria-live="polite"
          aria-atomic="true"
        >
          {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
        <div className="comment-form__actions">
          {onCancel && (
            <button
              type="button"
              className="comment-form__cancel-btn"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="comment-form__submit-btn"
            disabled={isSubmitting || charCount === 0 || isOverLimit}
          >
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
      {error && (
        <p id={errorId} className="comment-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
