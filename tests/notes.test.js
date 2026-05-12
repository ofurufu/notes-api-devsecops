const request = require('supertest')
const app = require('../src/app')
const notesRouter = require('../src/routes/notes')

// Reset in-memory store before each test so tests don't bleed into each other
beforeEach(() => notesRouter.resetNotes())

describe('Notes API — CRUD', () => {

  describe('GET /api/notes', () => {
    test('returns empty array when no notes exist', async () => {
      const res = await request(app).get('/api/notes')
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
      expect(res.body.count).toBe(0)
    })
  })

  describe('POST /api/notes', () => {
    test('creates a note with valid data', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'Test Note', body: 'This is a test body' })
      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('Test Note')
      expect(res.body.data.id).toBe(1)
    })

    test('returns 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ body: 'No title here' })
      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    test('returns 400 if body is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'No body here' })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/notes/:id', () => {
    test('returns a specific note', async () => {
      await request(app)
        .post('/api/notes')
        .send({ title: 'My Note', body: 'My body' })
      const res = await request(app).get('/api/notes/1')
      expect(res.statusCode).toBe(200)
      expect(res.body.data.id).toBe(1)
    })

    test('returns 404 for non-existent note', async () => {
      const res = await request(app).get('/api/notes/999')
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PUT /api/notes/:id', () => {
    test('updates a note', async () => {
      await request(app)
        .post('/api/notes')
        .send({ title: 'Old Title', body: 'Old body' })
      const res = await request(app)
        .put('/api/notes/1')
        .send({ title: 'New Title' })
      expect(res.statusCode).toBe(200)
      expect(res.body.data.title).toBe('New Title')
      expect(res.body.data.body).toBe('Old body')
    })

    test('returns 404 when updating non-existent note', async () => {
      const res = await request(app)
        .put('/api/notes/999')
        .send({ title: 'Ghost' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/notes/:id', () => {
    test('deletes a note', async () => {
      await request(app)
        .post('/api/notes')
        .send({ title: 'Delete me', body: 'Soon gone' })
      const res = await request(app).delete('/api/notes/1')
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('returns 404 when deleting non-existent note', async () => {
      const res = await request(app).delete('/api/notes/999')
      expect(res.statusCode).toBe(404)
    })
  })
})