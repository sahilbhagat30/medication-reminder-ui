/**
 * server/index.js
 *
 * Backend-For-Frontend (BFF) entry point for the Medication Reminder UI.
 * Connects to PostgreSQL, serves API routes, and acts as the static file
 * server for the built React frontend in production.
 */
import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { requestLogger } from './middleware/logger.js';
import pool from './db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 8080; // Default to 8080 for Cloud Run

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(requestLogger);

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

const server = app.listen(PORT, () => {
  console.log(`✅ BFF running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
