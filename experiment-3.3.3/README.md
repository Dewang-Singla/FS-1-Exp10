# Experiment 3.3.3 - Social Media App with AWS Deployment

## Aim
To build a social media platform with authentication, feed posts, likes, comments, and AWS deployment guidance.

## Features
- Register and log in securely with JWT
- Create, edit, and delete posts with optional image URLs
- View a shared feed of posts
- Like and comment on posts
- Deployment notes for AWS EC2, Elastic Beanstalk, and ECS

## Run

### Backend
```bash
cd social-media-app/backend
npm install
npm start
```

### Frontend
```bash
cd social-media-app/frontend
npm install
npm run dev
```

## Default URLs
- Backend: `http://localhost:5002`
- Frontend: `http://localhost:5173`

## AWS Deployment Notes
- Place the backend on EC2, Elastic Beanstalk, or ECS.
- Use Amazon RDS or MongoDB Atlas for the database.
- Set environment variables for `MONGO_URI`, `JWT_SECRET`, `PORT`, and `FRONTEND_URL`.
- Serve the frontend from S3 + CloudFront or a static hosting service.
