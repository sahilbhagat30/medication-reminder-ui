// server/index.js — Express BFF entry point
import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import routes  from './routes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 8080; // Default to 8080 for Cloud Run

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ── Request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Mount all API routes under /api ───────────────────────────
app.use('/api', routes);

// ── Serve React Frontend (Production) ─────────────────────────
// In Cloud Run, the Express server will also serve the static React files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React's index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ BFF running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
});
