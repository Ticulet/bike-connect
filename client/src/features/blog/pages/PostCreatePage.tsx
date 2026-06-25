import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { JSONContent } from '@tiptap/react';
import { POST_CATEGORIES, POST_STATUSES } from '@bike-connect/shared';
import { createPost, fetchTags, type TagItem, type CreatePostPayload } from '../api/posts.api.js';
import { PostEditor } from '../components/PostEditor.js';
import { ImageUploader } from '../../../components/ui/ImageUploader.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './post-form.css';

interface FormState {
  title: string;
  category: string;
  coverImageUrl: string;
  status: string;
  excerpt: string;
}

const EMPTY_CONTENT: JSONContent = { type: 'doc', content: [] };

export function PostCreatePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    title: '',
    category: POST_CATEGORIES[0],
    coverImageUrl: '',
    status: POST_STATUSES[0],
    excerpt: '',
  });
  const [editorContent, setEditorContent] = useState<JSONContent>(EMPTY_CONTENT);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tagsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    tagsAbortRef.current = controller;

    fetchTags()
      .then((result) => {
        if (!controller.signal.aborted) {
          setTags(result);
        }
      })
      .catch(() => {
        // Non-critical: tags simply won't show
      });

    return () => {
      controller.abort();
    };
  }, []);

  function handleFieldChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTagToggle(tagId: number): void {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreatePostPayload = {
        title: form.title,
        category: form.category,
        status: form.status,
        content: editorContent,
        excerpt: form.excerpt.trim() || undefined,
        cover_image_url: form.coverImageUrl.trim() || undefined,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };

      const created = await createPost(payload);
      void navigate(`/posts/${created.slug}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(`Failed to create post (${err.code})`);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main" className="post-form-page">
      <h1 className="post-form-page__heading">New Post</h1>

      {submitError && (
        <p className="post-form__error" role="alert">
          {submitError}
        </p>
      )}

      <form className="post-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="post-form__field">
          <label className="post-form__label post-form__label--required" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="post-form__input"
            value={form.title}
            onChange={handleFieldChange}
            required
            aria-required="true"
            maxLength={200}
          />
        </div>

        <div className="post-form__field">
          <label className="post-form__label post-form__label--required" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="post-form__select"
            value={form.category}
            onChange={handleFieldChange}
            required
            aria-required="true"
          >
            {POST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="post-form__field">
          <label className="post-form__label" htmlFor="excerpt">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            className="post-form__input"
            value={form.excerpt}
            onChange={handleFieldChange}
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="post-form__field">
          <span className="post-form__label">Cover image</span>
          {form.coverImageUrl !== '' && (
            <div className="post-form__cover-preview">
              <img
                src={form.coverImageUrl}
                alt="Cover preview"
                className="post-form__cover-preview-img"
              />
              <button
                type="button"
                className="btn btn-ghost post-form__cover-remove"
                onClick={() => setForm((prev) => ({ ...prev, coverImageUrl: '' }))}
              >
                Remove cover
              </button>
            </div>
          )}
          <ImageUploader
            onUpload={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
            label={form.coverImageUrl !== '' ? 'Replace cover image' : 'Upload cover image'}
          />
        </div>

        {tags.length > 0 && (
          <fieldset className="post-form__field" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="post-form__label">Tags</legend>
            <div className="post-form__tags" role="group" aria-label="Select tags">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  aria-pressed={selectedTagIds.includes(tag.id)}
                  className={`post-form__tag-chip${selectedTagIds.includes(tag.id) ? ' post-form__tag-chip--selected' : ''}`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="post-form__field">
          <span className="post-form__label" id="editor-label">
            Content
          </span>
          <div
            className="post-form__editor-wrapper"
            role="group"
            aria-labelledby="editor-label"
          >
            <PostEditor
              content={editorContent}
              onChange={setEditorContent}
              placeholder="Write your post..."
            />
          </div>
        </div>

        <div className="post-form__field">
          <label className="post-form__label post-form__label--required" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="post-form__select"
            value={form.status}
            onChange={handleFieldChange}
            required
            aria-required="true"
          >
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="post-form__actions">
          <button
            type="submit"
            className="post-form__submit"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </main>
  );
}
