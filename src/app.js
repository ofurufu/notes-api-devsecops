const express = require('express')
const notesRouter = require('./routes/notes')

const app = express()

// Middleware
app.use(express.json())

// Health check — CI/CD and load balancers use this
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  })
})

// Routes
app.use('/api/notes', notesRouter)

// 404 handler — catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` })
})

module.exports = app