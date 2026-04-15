import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchMyPosts, updatePost, deletePost, type PostSummary, type UpdatePostPayload } from '../api/posts.api.js';
import { PostManagementCard } from '../components/PostManagementCard.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './my-posts.css';

type TabFilter = 'all' | 'draft' | 'published';

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Published', value: 'published' },
];

export function MyPostsPage(): React.JSX.Element {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadPosts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMyPosts();
      if (controller.signal.aborted) return;
      setPosts(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPosts();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadPosts]);

  async function handlePublishToggle(postId: string, newStatus: 'draft' | 'published'): Promise<void> {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setUpdatingId(postId);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: newStatus } : p,
      ),
    );

    try {
      const payload: UpdatePostPayload = {
        status: newStatus,
        expected_updated_at: post.updated_at,
      };
      const updated = await updatePost(postId, payload);
      // Sync server-returned updated_at so subsequent toggles use the fresh value
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, updated_at: updated.updated_at } : p,
        ),
      );
    } catch (err) {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: post.status } : p,
        ),
      );
      const message = err instanceof ApiClientError && err.status === 409
        ? 'Post was modified elsewhere. Please reload.'
        : 'Failed to update status';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      await deletePost(deleteTargetId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch {
      setError('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredPosts = activeTab === 'all'
    ? posts
    : posts.filter((p) => p.status === activeTab);

  return (
    <main id="main" className="my-posts-page">
      <h1 className="my-posts-page__heading">My Posts</h1>

      <Link to="/posts/new" className="my-posts-page__new-link">
        + New Post
      </Link>

      <nav aria-label="Post status filter">
        <ul className="my-posts-page__tabs" role="tablist" aria-label="Filter posts by status">
          {TABS.map((tab) => (
            <li key={tab.value} role="presentation">
              <button
                type="button"
                role="tab"
                id={`tab-${tab.value}`}
                aria-selected={activeTab === tab.value}
                aria-controls="posts-tabpanel"
                className={`my-posts-page__tab${activeTab === tab.value ? ' my-posts-page__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section
        id="posts-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {error && (
          <p className="post-form__error" role="alert">
            {error}
          </p>
        )}

        {isLoading && <p aria-live="polite">Loading your posts...</p>}

        {!isLoading && filteredPosts.length === 0 && (
          <div className="my-posts-page__empty">
            <p>
              {activeTab === 'all'
                ? 'You have no posts yet.'
                : `No ${activeTab} posts.`}
            </p>
            <Link to="/posts/new">Write your first post</Link>
          </div>
        )}

        {!isLoading && filteredPosts.length > 0 && (
          <div className="my-posts-page__list" aria-live="polite">
            {filteredPosts.map((post) => (
              <PostManagementCard
                key={post.id}
                post={post}
                onPublishToggle={(id, status) => void handlePublishToggle(id, status)}
                onDelete={(id) => setDeleteTargetId(id)}
                isUpdating={updatingId === post.id}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </main>
  );
}
