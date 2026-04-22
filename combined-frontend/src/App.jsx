import { useMemo, useState } from 'react';
import './App.css';

const apps = [
  {
    id: 'exp331',
    label: 'Experiment 3.3.1',
    title: 'Todo Application with CRUD',
    description: 'Create, update, mark complete, and delete todos.',
    url: import.meta.env.VITE_EXP331_URL || 'https://exp-3-3-1.netlify.app',
    colorClass: 'theme-todo',
  },
  {
    id: 'exp332',
    label: 'Experiment 3.3.2',
    title: 'Blog Platform',
    description: 'User profiles, posts, and comments with JWT auth.',
    url: import.meta.env.VITE_EXP332_URL || 'https://exp-3-3-2.netlify.app',
    colorClass: 'theme-blog',
  },
  {
    id: 'exp333',
    label: 'Experiment 3.3.3',
    title: 'Social Media App',
    description: 'Feed, likes, comments, and multi-user interactions.',
    url: import.meta.env.VITE_EXP333_URL || 'https://exp-3-3-3.netlify.app',
    colorClass: 'theme-social',
  },
];

function App() {
  const [activeId, setActiveId] = useState(apps[0].id);

  const activeApp = useMemo(() => apps.find((app) => app.id === activeId) || apps[0], [activeId]);

  return (
    <main className={`hub-shell ${activeApp.colorClass}`}>
      <section className="hero">
        <p className="eyebrow">Experiment 3.3 Combined Frontend</p>
        <h1>Frontend Switchboard</h1>
        <p className="subtitle">
          Use the buttons below to switch between 3.3.1, 3.3.2, and 3.3.3 from one primary frontend deployment.
        </p>
      </section>

      <section className="switcher-panel">
        <div className="button-row">
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              className={activeId === app.id ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveId(app.id)}
            >
              {app.label}
            </button>
          ))}
        </div>

        <article className="active-info">
          <h2>{activeApp.title}</h2>
          <p>{activeApp.description}</p>
        </article>
      </section>

      <section className="viewer-panel">
        {activeApp.url ? (
          <>
            <div className="viewer-header">
              <span>Embedded app URL:</span>
              <a href={activeApp.url} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            </div>
            <iframe
              title={activeApp.label}
              src={activeApp.url}
              className="app-frame"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </>
        ) : (
          <div className="empty-state">
            <h3>Missing URL for {activeApp.label}</h3>
            <p>
              Set the corresponding Netlify environment variable in this app:
            </p>
            <ul>
              <li>3.3.1: `VITE_EXP331_URL`</li>
              <li>3.3.2: `VITE_EXP332_URL`</li>
              <li>3.3.3: `VITE_EXP333_URL`</li>
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
