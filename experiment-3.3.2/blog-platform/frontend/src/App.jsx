import { useEffect, useMemo, useState } from 'react';
import api from './api';
import './App.css';

const emptyAuth = { name: '', email: '', password: '' };
const emptyProfile = { name: '', bio: '', avatarUrl: '' };
const emptyPost = { title: '', content: '', tags: '' };

function App() {
  const [token, setToken] = useState(localStorage.getItem('blog-token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [postForm, setPostForm] = useState(emptyPost);
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const totalComments = useMemo(
    () => Object.values(commentsByPost).reduce((count, list) => count + list.length, 0),
    [commentsByPost]
  );

  useEffect(() => {
    if (token) {
      loadSession();
    } else {
      loadPublicPosts();
    }
  }, [token]);

  async function loadSession() {
    try {
      setError('');
      const [{ data: meResponse }, { data: postsResponse }] = await Promise.all([
        api.get('/auth/me'),
        api.get('/posts'),
      ]);
      setCurrentUser(meResponse.user);
      setProfileForm({
        name: meResponse.user.name || '',
        bio: meResponse.user.bio || '',
        avatarUrl: meResponse.user.avatarUrl || '',
      });
      setPosts(postsResponse.data || []);
      await loadAllComments(postsResponse.data || []);
    } catch (requestError) {
      setToken('');
      localStorage.removeItem('blog-token');
      setError(requestError.response?.data?.message || 'Session expired. Please sign in again.');
      await loadPublicPosts();
    } finally {
      setLoading(false);
    }
  }

  async function loadPublicPosts() {
    try {
      const { data } = await api.get('/posts');
      setPosts(data.data || []);
      await loadAllComments(data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllComments(postList) {
    const commentEntries = await Promise.all(
      postList.map(async (post) => {
        const { data } = await api.get(`/comments/post/${post._id}`);
        return [post._id, data.data || []];
      })
    );

    setCommentsByPost(Object.fromEntries(commentEntries));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : authForm;

      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('blog-token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setMessage(authMode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');
      setAuthForm(emptyAuth);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Authentication failed');
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    try {
      const { data } = await api.put('/auth/me', profileForm);
      setCurrentUser(data.user);
      setProfileForm({
        name: data.user.name || '',
        bio: data.user.bio || '',
        avatarUrl: data.user.avatarUrl || '',
      });
      setMessage('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update profile');
    }
  }

  async function handlePostSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        title: postForm.title,
        content: postForm.content,
        tags: postForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };

      if (editingPostId) {
        const { data } = await api.put(`/posts/${editingPostId}`, payload);
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === editingPostId ? data.data : post)));
        setEditingPostId(null);
        setMessage('Post updated successfully.');
      } else {
        const { data } = await api.post('/posts', payload);
        setPosts((currentPosts) => [data.data, ...currentPosts]);
        setMessage('Post published successfully.');
      }

      setPostForm(emptyPost);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save post');
    }
  }

  function startEditPost(post) {
    setEditingPostId(post._id);
    setPostForm({
      title: post.title,
      content: post.content,
      tags: (post.tags || []).join(', '),
    });
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setPostForm(emptyPost);
  }

  async function deletePost(postId) {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
      setCommentsByPost((currentComments) => {
        const copy = { ...currentComments };
        delete copy[postId];
        return copy;
      });
      if (editingPostId === postId) {
        cancelEditPost();
      }
      setMessage('Post deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete post');
    }
  }

  async function submitComment(postId) {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    try {
      const { data } = await api.post(`/comments/post/${postId}`, { text });
      setCommentsByPost((currentComments) => ({
        ...currentComments,
        [postId]: [...(currentComments[postId] || []), data.data],
      }));
      setCommentDrafts((currentDrafts) => ({ ...currentDrafts, [postId]: '' }));
      setMessage('Comment added successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to add comment');
    }
  }

  async function deleteComment(postId, commentId) {
    try {
      await api.delete(`/comments/${commentId}`);
      setCommentsByPost((currentComments) => ({
        ...currentComments,
        [postId]: (currentComments[postId] || []).filter((comment) => comment._id !== commentId),
      }));
      setMessage('Comment deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete comment');
    }
  }

  function logout() {
    localStorage.removeItem('blog-token');
    setToken('');
    setCurrentUser(null);
    setPosts([]);
    setCommentsByPost({});
    setMessage('Signed out successfully.');
    setEditingPostId(null);
    setPostForm(emptyPost);
  }

  return (
    <main className="blog-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Experiment 3.3.2</p>
          <h1>Blog Platform</h1>
          <p className="subtitle">A simple blogging platform with profiles, posts, and persistent comments.</p>
        </div>
        <div className="hero-metrics">
          <article>
            <strong>{posts.length}</strong>
            <span>Posts</span>
          </article>
          <article>
            <strong>{totalComments}</strong>
            <span>Comments</span>
          </article>
          <article>
            <strong>{currentUser ? currentUser.name : 'Guest'}</strong>
            <span>Viewer</span>
          </article>
        </div>
      </section>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      {!currentUser ? (
        <section className="auth-panel">
          <div className="panel-header">
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <div className="toggle-row">
              <button type="button" className={authMode === 'login' ? 'chip active' : 'chip'} onClick={() => setAuthMode('login')}>
                Login
              </button>
              <button type="button" className={authMode === 'register' ? 'chip active' : 'chip'} onClick={() => setAuthMode('register')}>
                Register
              </button>
            </div>
          </div>

          <form className="stack" onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <input placeholder="Full name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
            ) : null}
            <input type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
            <input type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
            <button type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Your profile</h2>
              <button type="button" className="chip" onClick={logout}>Logout</button>
            </div>

            <form className="stack" onSubmit={handleProfileSave}>
              <input placeholder="Name" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
              <input placeholder="Avatar URL" value={profileForm.avatarUrl} onChange={(event) => setProfileForm({ ...profileForm, avatarUrl: event.target.value })} />
              <textarea placeholder="Bio" rows="4" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
              <button type="submit">Save Profile</button>
            </form>
          </section>

          <section className="panel">
            <h2>{editingPostId ? 'Edit post' : 'Create post'}</h2>
            <form className="stack" onSubmit={handlePostSubmit}>
              <input placeholder="Post title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} />
              <textarea placeholder="Write your post..." rows="6" value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} />
              <input placeholder="Tags separated by commas" value={postForm.tags} onChange={(event) => setPostForm({ ...postForm, tags: event.target.value })} />
              <div className="inline-actions">
                <button type="submit">{editingPostId ? 'Update Post' : 'Publish Post'}</button>
                {editingPostId ? (
                  <button type="button" className="chip" onClick={cancelEditPost}>Cancel</button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="posts-section">
        <div className="panel-header">
          <h2>Latest posts</h2>
          <span className="muted">{loading ? 'Loading...' : `${posts.length} items`}</span>
        </div>

        <div className="posts-grid">
          {posts.map((post) => {
            const comments = commentsByPost[post._id] || [];
            const isAuthor = currentUser && post.author?._id === currentUser.id;

            return (
              <article key={post._id} className="post-card">
                <div className="post-head">
                  <div>
                    <p className="post-meta">By {post.author?.name || 'Unknown author'}</p>
                    <h3>{post.title}</h3>
                  </div>
                  {isAuthor ? (
                    <div className="inline-actions">
                      <button type="button" className="chip" onClick={() => startEditPost(post)}>Edit</button>
                      <button type="button" className="chip danger" onClick={() => deletePost(post._id)}>Delete</button>
                    </div>
                  ) : null}
                </div>

                <p className="post-content">{post.content}</p>

                {post.tags?.length ? (
                  <div className="tag-row">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                ) : null}

                <div className="comments-block">
                  <h4>Comments</h4>
                  <div className="comment-list">
                    {comments.map((comment) => {
                      const canDelete = currentUser && comment.author?._id === currentUser.id;
                      return (
                        <article key={comment._id} className="comment-item">
                          <div>
                            <strong>{comment.author?.name || 'Anonymous'}</strong>
                            <p>{comment.text}</p>
                          </div>
                          {canDelete ? (
                            <button type="button" className="chip danger" onClick={() => deleteComment(post._id, comment._id)}>
                              Remove
                            </button>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  {currentUser ? (
                    <div className="comment-form">
                      <input
                        placeholder="Add a comment"
                        value={commentDrafts[post._id] || ''}
                        onChange={(event) => setCommentDrafts({ ...commentDrafts, [post._id]: event.target.value })}
                      />
                      <button type="button" onClick={() => submitComment(post._id)}>Comment</button>
                    </div>
                  ) : (
                    <p className="muted">Sign in to join the discussion.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;