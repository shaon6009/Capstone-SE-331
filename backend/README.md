# DIU Connect Backend (Node + Neon PostgreSQL)

## 1) Setup

1. Install backend dependencies:
   - `npm --prefix backend install`
2. Create env file:
   - Copy `backend/.env.example` to `backend/.env`
3. Update `backend/.env`:
   - `DATABASE_URL`: your Neon connection string
   - `JWT_SECRET`: long random string
   - `CORS_ORIGIN`: frontend URL (default `http://localhost:5173`)

## 2) Create database schema on Neon

Run this SQL in Neon SQL editor:

- `backend/sql/schema.sql`

Optional sample rows:

- `backend/sql/seed.sql`

`seed.sql` demo credentials:
- email: `demo@diu.edu.bd`
- password: `password123`

## 3) Run backend

- Development: `npm --prefix backend run dev`
- Production: `npm --prefix backend start`

Backend base URL:
- `http://localhost:4000/api`

## 4) Frontend env

Root `.env` should contain:

- `VITE_API_URL="http://localhost:4000/api"`
