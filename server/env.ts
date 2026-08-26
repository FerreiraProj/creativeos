// Side-effect-only module: loads .env into process.env as early as possible.
// Must be the FIRST import in server/index.ts. ES module imports are evaluated before the
// importing file's own top-level code runs, regardless of where the import line appears in
// that file — so other server modules (db.ts, auth.ts, routes/ai.ts) that read
// process.env.* at module-load time would otherwise see an empty environment if
// dotenv.config() lived only in index.ts.
import dotenv from 'dotenv';

const hadNodeEnv = process.env.NODE_ENV !== undefined;
const result = dotenv.config();

// NODE_ENV must always come from the real runtime (Docker's `ENV NODE_ENV=production`, a
// shell export, etc.), never from this .env file. This module is also reached by
// vite.config.ts (it mounts the Express app as dev middleware), so an .env-sourced
// NODE_ENV would otherwise leak into the unrelated `vite build` process and silently
// flip React/Vite into development mode, bloating the production client bundle.
if (!hadNodeEnv && result.parsed?.NODE_ENV !== undefined) {
  delete process.env.NODE_ENV;
}
