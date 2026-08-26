# Projects Creative OS

AI-powered creative operating system to plan, generate, manage, shot-produce, and analyze
high-performance multi-channel content with brand and creative memory.

## Run locally

**Prerequisites:** Node.js 20+, a PostgreSQL database (a throwaway one via Docker works fine
for local dev: `docker run -d -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=creative_os_dev -p 5498:5432 postgres:16-alpine`).

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `GEMINI_API_KEY`, and a login
   password (`APP_PASSWORD` for local dev, or `APP_PASSWORD_HASH` for a bcrypt hash).
3. Run the app: `npm run dev` — open http://localhost:3000 and log in with your password.

## Build & run in production

```
npm run build   # builds the client (dist/) and bundles the server (dist-server/)
npm start       # runs dist-server/index.js
```

## Deploy

A `Dockerfile` is included for deployment to a Coolify-managed VPS (or any Docker host) with
a managed Postgres instance — see `.env.example` for the required environment variables.
