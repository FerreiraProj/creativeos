import './env.ts';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import aiRouter from './routes/ai.ts';
import projectsRouter from './routes/projects.ts';
import settingsRouter from './routes/settings.ts';
import authRouter from './routes/auth.ts';
import mediaRouter from './routes/media.ts';
import { ensureSchema } from './db.ts';
import { sessionMiddleware, requireAuth } from './auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Coolify/Traefik terminates TLS upstream and forwards plain HTTP to this container,
// so Express must be told to trust the proxy for req.secure / secure cookies to work.
app.set('trust proxy', 1);

// Baseline security headers. The default Content-Security-Policy is disabled because it
// would need hand-tuning to allow the Google Fonts + Vite/React setup this app already
// relies on (index.html) — the rest of Helmet's headers (X-Content-Type-Options,
// X-Frame-Options, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json({ limit: '25mb' }));
app.use(sessionMiddleware);

// Cheap guardrails: the AI routes call a paid external API, and the login route is a
// brute-force target — both get a per-IP rate limit.
const aiRateLimit = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const loginRateLimit = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth/login', loginRateLimit);
app.use('/api/auth', authRouter);
app.use('/api/ai', requireAuth, aiRateLimit, aiRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// Media generation (Fal.ai): rate-limit only the two endpoints that actually cost money /
// trigger generation. /shot-video/status is polled every few seconds per in-flight job and
// must stay outside that budget, or polling alone would exhaust it.
app.use('/api/media/character-image', requireAuth, aiRateLimit);
app.use('/api/media/upload-character-image', requireAuth, aiRateLimit);
app.use('/api/media/shot-video/submit', requireAuth, aiRateLimit);
app.use('/api/media', requireAuth, mediaRouter);

// Production static file serving. `server/index.ts` lives one directory deeper than the
// project root, so the built client output ("dist/") is one level up from here.
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server when run directly as main script
const isMain = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMain) {
  ensureSchema()
    .catch((err) => console.error('Failed to ensure DB schema:', err))
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`Projects Creative OS server running on port ${PORT}`);
      });
    });
} else {
  // Running as Vite's dev middleware — ensure schema in the background without
  // blocking Vite's own startup.
  ensureSchema().catch((err) => console.error('Failed to ensure DB schema:', err));
}

export default app;
