// src/routes/notes.js

const express = require('express');
const router = express.Router();

// In-memory store — an array of note objects.
// In a real app this would be a database call.
// Using a module-level variable means tests can reset it between runs.
let notes = [];
let nextId = 1;    // Simple auto-increment ID counter

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Validates that a note body has the required fields.
 * Returns an error message string, or null if valid.
 */
function validateNote(body) {
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return 'title is required and must be a non-empty string';
  }
  if (body.title.trim().length > 100) {
    return 'title must be 100 characters or fewer';
  }
  if (body.content !== undefined && typeof body.content !== 'string') {
    return 'content must be a string';
  }
  return null;
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

// GET /api/notes — Return all notes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    count: notes.length,
    data: notes,
  });
});

// GET /api/notes/:id — Return a single note by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'id must be a number',
    });
  }

  const note = notes.find((n) => n.id === id);

  if (!note) {
    return res.status(404).json({
      success: false,
      error: `Note with id ${id} not found`,
    });
  }

  res.json({ success: true, data: note });
});

// POST /api/notes — Create a new note
router.post('/', (req, res) => {
  const validationError = validateNote(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      error: validationError,
    });
  }

  const note = {
    id: nextId++,
    title: req.body.title.trim(),
    content: req.body.content ? req.body.content.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.push(note);

  // 201 Created — correct status for a successful POST that creates a resource
  res.status(201).json({ success: true, data: note });
});

// PUT /api/notes/:id — Replace a note entirely
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'id must be a number' });
  }

  const index = notes.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Note with id ${id} not found`,
    });
  }

  const validationError = validateNote(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  // Preserve id and createdAt; update everything else
  notes[index] = {
    ...notes[index],
    title: req.body.title.trim(),
    content: req.body.content ? req.body.content.trim() : '',
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, data: notes[index] });
});

// DELETE /api/notes/:id — Remove a note
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'id must be a number' });
  }

  const index = notes.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Note with id ${id} not found`,
    });
  }

  notes.splice(index, 1);

  // 200 with confirmation is more informative than 204 No Content for an API
  res.json({ success: true, message: `Note ${id} deleted` });
});

// ─── Test Utilities ──────────────────────────────────────────────────────────

// This function lets tests reset state between runs.
// It's ONLY used in tests — never called in production code.
function resetStore() {
  notes = [];
  nextId = 1;
}

module.exports = { router, resetStore };