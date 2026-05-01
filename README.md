# Team Task Manager

A collaborative task management web app using the MERN stack (MongoDB, Express, React, Node.js) with Tailwind CSS.

## Features
- **Authentication**: JWT-based user signup/login, role-based access control (Admin, Member).
- **Projects**: Create projects, add members.
- **Tasks**: Create, update, assign tasks with priority and status tracking on a Kanban board.
- **Dashboard**: Track overall progress with charts and statistics.

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)

## Getting Started Locally

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on http://localhost:5000*

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The app will run on http://localhost:5173*
   *Note: In development, we use proxy settings (configured in `vite.config.js` or via base URL if running concurrently). If needed, update API base URL in `frontend/src/services/api.js` to `http://localhost:5000/api`.*

Wait, the `vite.config.js` does NOT have a proxy setup currently!
To fix CORS locally, you may need to update `frontend/src/services/api.js` to use the full backend URL, or configure Vite's proxy.

Let me configure Vite's proxy for you.

## Railway Deployment Steps

### 1. Preparation
We will deploy the backend and frontend separately on Railway, or use a monorepo setup. The easiest way is separating them.

**Backend Deployment on Railway:**
1. Create a new GitHub repo and push this entire folder.
2. Go to Railway (railway.app) and create a New Project -> "Deploy from GitHub repo".
3. Select the repository.
4. Go to Settings -> Environment Variables. Add:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string.
   - `NODE_ENV`: production
5. Go to Settings -> Build. Change the "Root Directory" to `/backend`.
6. Railway will automatically install dependencies and start the app using `node server.js`.

**Frontend Deployment on Railway:**
1. In the same Railway project, click "New" -> "GitHub Repo" and select the same repository again.
2. Go to Settings -> Build. Change the "Root Directory" to `/frontend`.
3. Set the build command to `npm run build` and the start command or output directory to `dist`. Railway has a Static Site builder that handles this.
4. Set an environment variable for the backend URL if your code uses it (e.g., `VITE_API_URL` pointing to the Railway backend domain). 
*Note: Since we hardcoded `/api`, you will need to change `baseURL: '/api'` to the Railway backend domain or use `VITE_API_URL` environment variable.*

## Common Errors & Fixes
- **"npm is not recognized"**: You need to install Node.js from https://nodejs.org/.
- **CORS Error**: Ensure the backend's `cors` middleware is enabled and correctly configured if the frontend is hosted on a different domain.
- **MongoDB Connection Failed**: Ensure your local MongoDB server is running, or provide a valid Atlas connection string in the `.env` file.
