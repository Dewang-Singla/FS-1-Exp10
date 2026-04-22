# Experiment 3.3 - MERN Full Stack Applications

This bundle contains three complete full-stack mini projects focused on CRUD, authentication, and deployment-ready patterns.

## Experiments

| Experiment | Title | Stack |
|---|---|---|
| 3.3.1 | Todo Application with CRUD Operations | React, Node.js, Express.js, MongoDB |
| 3.3.2 | Blog Platform with Comments and User Profiles | React, Node.js, Express.js, JWT, MongoDB |
| 3.3.3 | Social Media App with AWS Deployment | React, Node.js, Express.js, JWT, MongoDB, AWS-ready deployment notes |

## Folder Structure

- `experiment-3.3.1/todo-app/`
- `experiment-3.3.2/blog-platform/`
- `experiment-3.3.3/social-media-app/`
- `combined-frontend/` (single deployable frontend with switch buttons for 3.3.1/3.3.2/3.3.3)

## Quick Start

### 3.3.1 - Todo App

```bash
cd experiment-3.3.1/todo-app/backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

### 3.3.2 - Blog Platform

```bash
cd experiment-3.3.2/blog-platform/backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

### 3.3.3 - Social Media App

```bash
cd experiment-3.3.3/social-media-app/backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

### Combined Frontend Hub (Netlify-ready)

```bash
cd combined-frontend
npm install
npm run dev
```

For production deploy (Netlify), the app uses `netlify.toml` in `combined-frontend`.

Set these environment variables in Netlify to embed deployed frontends:

- `VITE_EXP331_URL` (deployed URL for 3.3.1 frontend)
- `VITE_EXP332_URL` (deployed URL for 3.3.2 frontend)
- `VITE_EXP333_URL` (deployed URL for 3.3.3 frontend)

## Database

All three backends default to a local MongoDB URI if `MONGO_URI` is not set. You can override it with your own connection string in a `.env` file.
