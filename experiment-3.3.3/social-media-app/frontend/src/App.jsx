import { useEffect, useMemo, useState } from 'react';
import api from './api';
import './App.css';

const emptyAuth = { name: '', email: '', password: '' };
const emptyPost = { content: '', imageUrl: '' };

function App() {
  const [token, setToken] = useState(localStorage.getItem('social-token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [postForm, setPostForm] = useState(emptyPost);
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const totalLikes = useMemo(
    () => posts.reduce((count, post) => count + (post.likes?.length || 0), 0),
    [posts]
  );

  useEffect(() => {
    if (token) {
      loadSession();
    } else {
      loadFeed();
    }
  }, [token]);

  async function loadSession() {
    try {
      setError('');
      const [{ data: meResponse }, { data: feedResponse }] = await Promise.all([
        api.get('/auth/me'),
        api.get('/posts/feed'),
      ]);

      setCurrentUser(meResponse.user);
      setPosts(feedResponse.data || []);
      await loadAllComments(feedResponse.data || []);
    } catch (requestError) {
      setToken('');
      localStorage.removeItem('social-token');
      setError(requestError.response?.data?.message || 'Session expired. Please sign in again.');
      await loadFeed();
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data.data || []);
      await loadAllComments(data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load feed');
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
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const { data } = await api.post(endpoint, payload);

      localStorage.setItem('social-token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthForm(emptyAuth);
      setMessage(authMode === 'login' ? 'Welcome back.' : 'Account created successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Authentication failed');
    }
  }

  async function handlePostSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        content: postForm.content,
        imageUrl: postForm.imageUrl,
      };

      if (editingPostId) {
        const { data } = await api.put(`/posts/${editingPostId}`, payload);
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === editingPostId ? data.data : post)));
        setMessage('Post updated successfully.');
        setEditingPostId(null);
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

  function startEdit(post) {
    setEditingPostId(post._id);
    setPostForm({ content: post.content, imageUrl: post.imageUrl || '' });
  }

  function cancelEdit() {
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
        cancelEdit();
      }
      setMessage('Post deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete post');
    }
  }

  async function toggleLike(postId) {
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setPosts((currentPosts) => currentPosts.map((post) => (post._id === postId ? data.data : post)));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update like');
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
    localStorage.removeItem('social-token');
    setToken('');
    setCurrentUser(null);
    setPosts([]);
    setCommentsByPost({});
    setEditingPostId(null);
    setPostForm(emptyPost);
    setMessage('Signed out successfully.');
  }

  return (
    <main className="social-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Experiment 3.3.3</p>
          <h1>Social Media App</h1>
          <p className="subtitle">A compact social feed with authentication, likes, comments, and AWS deployment guidance.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{posts.length}</strong>
            <span>Posts</span>
          </article>
          <article>
            <strong>{totalLikes}</strong>
            <span>Likes</span>
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
              <button type="button" className={authMode === 'login' ? 'chip active' : 'chip'} onClick={() => setAuthMode('login')}>Login</button>
              <button type="button" className={authMode === 'register' ? 'chip active' : 'chip'} onClick={() => setAuthMode('register')}>Register</button>
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
        <section className="compose-panel">
          <div className="panel-header">
            <h2>{editingPostId ? 'Edit post' : 'Create post'}</h2>
            <button type="button" className="chip" onClick={logout}>Logout</button>
          </div>

          <form className="stack" onSubmit={handlePostSubmit}>
            <textarea rows="5" placeholder="What is happening?" value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} />
            <input placeholder="Optional image URL" value={postForm.imageUrl} onChange={(event) => setPostForm({ ...postForm, imageUrl: event.target.value })} />
            <div className="inline-actions">
              <button type="submit">{editingPostId ? 'Update Post' : 'Post'}</button>
              {editingPostId ? <button type="button" className="chip" onClick={cancelEdit}>Cancel</button> : null}
            </div>
          </form>
        </section>
      )}

      <section className="feed-section">
        <div className="panel-header">
          <h2>Feed</h2>
          <span className="muted">{loading ? 'Loading...' : `${posts.length} updates`}</span>
        </div>

        <div className="feed-list">
          {posts.map((post) => {
            const comments = commentsByPost[post._id] || [];
            const isAuthor = currentUser && post.author?._id === currentUser.id;
            const isLiked = currentUser && post.likes?.some((like) => like === currentUser.id || like?._id === currentUser.id);

            return (
              <article key={post._id} className="post-card">
                <div className="post-head">
                  <div className="author-block">
                    <strong>{post.author?.name || 'Anonymous'}</strong>
                    <p className="muted">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                  {isAuthor ? (
                    <div className="inline-actions">
                      <button type="button" className="chip" onClick={() => startEdit(post)}>Edit</button>
                      <button type="button" className="chip danger" onClick={() => deletePost(post._id)}>Delete</button>
                    </div>
                  ) : null}
                </div>

                <p className="post-content">{post.content}</p>

                {post.imageUrl ? <img className="post-image" src={post.imageUrl} alt="Post visual" /> : null}

                <div className="action-row">
                  <button type="button" className={isLiked ? 'chip active' : 'chip'} onClick={() => toggleLike(post._id)}>
                    {isLiked ? 'Unlike' : 'Like'} · {post.likes?.length || 0}
                  </button>
                </div>

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
                      <input placeholder="Write a comment" value={commentDrafts[post._id] || ''} onChange={(event) => setCommentDrafts({ ...commentDrafts, [post._id]: event.target.value })} />
                      <button type="button" onClick={() => submitComment(post._id)}>Comment</button>
                    </div>
                  ) : (
                    <p className="muted">Sign in to like and comment.</p>
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