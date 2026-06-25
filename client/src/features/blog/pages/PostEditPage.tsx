import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { JSONContent } from '@tiptap/react';
import { POST_CATEGORIES, POST_STATUSES } from '@bike-connect/shared';
import {
  fetchPostById,
  updatePost,
  fetchTags,
  type PostDetail,
  type TagItem,
  type UpdatePostPayload,
} from '../api/posts.api.js';
import { PostEditor } from '../components/PostEditor.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { ImageUploader } from '../../../components/ui/ImageUploader.js';
import './post-form.css';

interface FormState {
  title: string;
  category: string;
  coverImageUrl: string;
  status: string;
  excerpt: string;
}

export function PostEditPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [form, setForm] = useState<FormState>({
    title: '',
    category: POST_CATEGORIES[0],
    coverImageUrl: '',
    status: POST_STATUSES[0],
    excerpt: '',
  });
  const [editorContent, setEditorContent] = useState<JSONContent>({ type: 'doc', content: [] });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);

  const loadAbortRef = useRef<AbortController | null>(null);

  // Load post and tags in parallel
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    loadAbortRef.current = controller;
    setIsLoadingPost(true);
    setLoadError(null);
    setNotFound(false);

    Promise.all([fetchPostById(id), fetchTags()])
      .then(([loadedPost, loadedTags]) => {
        if (controller.signal.aborted) return;

        setPost(loadedPost);
        setForm({
          title: loadedPost.title,
          category: loadedPost.category,
          coverImageUrl: loadedPost.cover_image_url ?? '',
          status: loadedPost.status,
          excerpt: loadedPost.excerpt ?? '',
        });
        setEditorContent(loadedPost.content as JSONContent);
        setSelectedTagIds(loadedPost.tags.map((t) => t.id));
        setTags(loadedTags);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load post',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingPost(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id]);

  function handleFieldChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTagToggle(tagId: number): void {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((tid) => tid !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!post || !id) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setConflictError(false);

    try {
      const payload: UpdatePostPayload = {
        title: form.title,
        category: form.category,
        status: form.status,
        content: editorContent,
        expected_updated_at: post.updated_at,
        excerpt: form.excerpt.trim() || null,
        cover_image_url: form.coverImageUrl.trim() || null,
        tag_ids: selectedTagIds,
      };

      const updated = await updatePost(id, payload);
      void navigate(`/posts/${updated.slug}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setConflictError(true);
        } else {
          setSubmitError(`Failed to save post (${err.code})`);
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingPost) {
    return (
      <main id="main" className="post-form-page">
        <p aria-live="polite">Loading post...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main id="main" className="post-form-page">
        <h1 className="post-form-page__heading">Post not found</h1>
        <p>The post you are trying to edit does not exist.</p>
      </main>
    );
  }

  if (loadError || !post) {
    return (
      <main id="main" className="post-form-page">
        <p className="post-form__error" role="alert">
          {loadError ?? 'An unexpected error occurred.'}
        </p>
      </main>
    );
  }

  return (
    <main id="main" className="post-form-page">
      <h1 className="post-form-page__heading">Edit Post</h1>

      {conflictError && (
        <p className="post-form__conflict" role="alert">
          Post was modified by someone else. Please{' '}
          <a href={`/posts/${id}/edit`}>reload the page</a> to get the latest
          version before saving.
        </p>
      )}

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
                className="btn post-form__cover-remove"
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
          <span className="post-form__label" id="editor-label-edit">
            Content
          </span>
          <div
            className="post-form__editor-wrapper"
            role="group"
            aria-labelledby="editor-label-edit"
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  );
}
