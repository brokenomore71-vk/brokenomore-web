import express from 'express';
import cors from 'cors';
import { adminRouter } from './routes/admin.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render sits in front of us

// Only the website may call this API from a browser. Comma-separated list, e.g.
// ALLOWED_ORIGINS=https://brokenomore.in,https://www.brokenomore.in
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET'],
    maxAge: 600,
  })
);

app.use((_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  next();
});

// Render's health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`admin-api listening on :${port}`));
