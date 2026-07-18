// src/app.js

const express = require('express');
const { router: notesRouter } = require('./routes/notes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Request logger — helpful during development and pipeline runs
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check — used by Docker health check and smoke tests in the pipeline
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
});

// Notes CRUD
app.use('/api/notes', notesRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

// Catches any route that wasn't matched above
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ─── Error Handler ───────────────────────────────────────────────────────────

// Express calls this when next(error) is called anywhere
// The four-parameter signature is required — Express detects it by arity
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

module.exports = app;