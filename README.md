# Care Connect OS

This repository is organized into separate frontend and backend applications.

## Root Commands

From the repository root, you can run:

- `npm run install:all` to install frontend and backend dependencies
- `npm run dev:frontend` to start the frontend dev server
- `npm run dev:backend` to start the backend dev server
- `npm run build:frontend` to build the frontend
- `npm run start:backend` to run the backend in normal mode

## Project Structure

- `frontend/`: Vite + React + TypeScript UI app
- `backend/`: Node.js + Express API server

## Prerequisites

- Node.js 18+
- npm 9+

## Install Dependencies

Run these commands from the repository root:

```bash
npm run install:all
```

## Run Frontend

```bash
npm run dev:frontend
```

Frontend runs on `http://localhost:5173` by default.

## Run Backend

```bash
cd backend
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
# cp .env.example .env

cd ..
npm run dev:backend
```

Backend runs on `http://localhost:5000` by default.

Health check endpoint:

`GET http://localhost:5000/api/health`

## Notes

- Configure CORS origin in `backend/.env` with `FRONTEND_ORIGIN`.
- Run frontend and backend in separate terminals.
