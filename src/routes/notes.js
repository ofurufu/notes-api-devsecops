const express = require('express')
const router = express.Router()

// In-memory store (fine for demo — real app would use a DB)
let notes = []
let nextId = 1

// GET /api/notes — list all notes
router.get('/', (req, res) => {
  res.json({ success: true, count: notes.length, data: notes })
})

// GET /api/notes/:id — get one note
router.get('/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id))
  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' })
  }
  res.json({ success: true, data: note })
})

// POST /api/notes — create a note
router.post('/', (req, res) => {
  const { title, body } = req.body
  if (!title || !body) {
    return res.status(400).json({
      success: false,
      error: 'Both title and body are required'
    })
  }
  const note = {
    id: nextId++,
    title,
    body,
    createdAt: new Date().toISOString()
  }
  notes.push(note)
  res.status(201).json({ success: true, data: note })
})

// PUT /api/notes/:id — update a note
router.put('/:id', (req, res) => {
  const index = notes.findIndex(n => n.id === parseInt(req.params.id))
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Note not found' })
  }
  const { title, body } = req.body
  notes[index] = {
    ...notes[index],
    title: title || notes[index].title,
    body: body || notes[index].body,
    updatedAt: new Date().toISOString()
  }
  res.json({ success: true, data: notes[index] })
})

// DELETE /api/notes/:id — delete a note
router.delete('/:id', (req, res) => {
  const index = notes.findIndex(n => n.id === parseInt(req.params.id))
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Note not found' })
  }
  notes.splice(index, 1)
  res.json({ success: true, message: 'Note deleted' })
})

// Helper to reset state between tests
router.resetNotes = () => { notes = []; nextId = 1 }

module.exports = router