import { useEffect, useMemo, useState } from 'react';
import api from './api';
import './App.css';

const emptyForm = { title: '' };

function App() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    return { total: todos.length, completed, pending: todos.length - completed };
  }, [todos]);

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      setError('');
      const response = await api.get('/todos');
      setTodos(response.data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter a todo title');
      return;
    }

    try {
      setError('');
      if (editingId) {
        const response = await api.patch(`/todos/${editingId}`, { title: form.title });
        setTodos((currentTodos) =>
          currentTodos.map((todo) => (todo._id === editingId ? response.data.data : todo))
        );
        setEditingId(null);
      } else {
        const response = await api.post('/todos', { title: form.title });
        setTodos((currentTodos) => [response.data.data, ...currentTodos]);
      }

      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save todo');
    }
  }

  function startEdit(todo) {
    setEditingId(todo._id);
    setForm({ title: todo.title });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function toggleTodo(todo) {
    try {
      const response = await api.patch(`/todos/${todo._id}`, { completed: !todo.completed });
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === todo._id ? response.data.data : item))
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update todo');
    }
  }

  async function deleteTodo(id) {
    try {
      await api.delete(`/todos/${id}`);
      setTodos((currentTodos) => currentTodos.filter((todo) => todo._id !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to delete todo');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Experiment 3.3.1</p>
          <h1>Todo CRUD App</h1>
          <p className="subtitle">Add, edit, complete, and delete todos through a MongoDB-backed API.</p>
        </div>

        <div className="stats-grid">
          <article>
            <strong>{stats.total}</strong>
            <span>Total</span>
          </article>
          <article>
            <strong>{stats.completed}</strong>
            <span>Done</span>
          </article>
          <article>
            <strong>{stats.pending}</strong>
            <span>Pending</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <form className="todo-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a new todo..."
            value={form.title}
            onChange={(event) => setForm({ title: event.target.value })}
          />
          <button type="submit">{editingId ? 'Update Todo' : 'Add Todo'}</button>
          {editingId ? (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          ) : null}
        </form>

        {error ? <p className="error-message">{error}</p> : null}

        {loading ? <p className="status-text">Loading todos...</p> : null}

        {!loading && todos.length === 0 ? <p className="status-text">No todos yet. Create your first task.</p> : null}

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo._id} className={todo.completed ? 'todo-item completed' : 'todo-item'}>
              <label className="todo-toggle">
                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo)} />
                <span>{todo.title}</span>
              </label>

              <div className="todo-actions">
                <button type="button" className="ghost" onClick={() => startEdit(todo)}>
                  Edit
                </button>
                <button type="button" className="ghost danger" onClick={() => deleteTodo(todo._id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;