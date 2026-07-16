// tests/notes.test.js

const request = require('supertest');
const app = require('../src/app');
const { resetStore } = require('../src/routes/notes');

// Before each test, wipe the in-memory store.
// This ensures tests are isolated — one test's data can't bleed into another.
beforeEach(() => {
  resetStore();
});

// ─── GET /api/notes ───────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('returns empty array when no notes exist', async () => {
    const res = await request(app).get('/api/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns all notes when notes exist', async () => {
    // Create two notes first
    await request(app)
      .post('/api/notes')
      .send({ title: 'Note A', content: 'Content A' });

    await request(app)
      .post('/api/notes')
      .send({ title: 'Note B', content: 'Content B' });

    const res = await request(app).get('/api/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe('Note A');
    expect(res.body.data[1].title).toBe('Note B');
  });
});

// ─── POST /api/notes ──────────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('creates a note with title and content', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'My Note', content: 'Some content' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.title).toBe('My Note');
    expect(res.body.data.content).toBe('Some content');
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('creates a note with only a title (content is optional)', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Title Only' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.content).toBe('');
  });

  it('trims whitespace from title and content', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: '  Padded Title  ', content: '  Padded content  ' });

    expect(res.body.data.title).toBe('Padded Title');
    expect(res.body.data.content).toBe('Padded content');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ content: 'No title here' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: '   ', content: 'Has content' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'a'.repeat(101) });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/100/);
  });

  it('auto-increments IDs across multiple notes', async () => {
    const first = await request(app).post('/api/notes').send({ title: 'First' });
    const second = await request(app).post('/api/notes').send({ title: 'Second' });
    const third = await request(app).post('/api/notes').send({ title: 'Third' });

    expect(first.body.data.id).toBe(1);
    expect(second.body.data.id).toBe(2);
    expect(third.body.data.id).toBe(3);
  });
});

// ─── GET /api/notes/:id ───────────────────────────────────────────────────────

describe('GET /api/notes/:id', () => {
  it('returns a note by id', async () => {
    await request(app).post('/api/notes').send({ title: 'Find Me' });

    const res = await request(app).get('/api/notes/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Find Me');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/notes/999');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/999/);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/notes/not-a-number');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/number/i);
  });
});

// ─── PUT /api/notes/:id ───────────────────────────────────────────────────────

describe('PUT /api/notes/:id', () => {
  it('updates a note title and content', async () => {
    await request(app).post('/api/notes').send({ title: 'Original', content: 'Old content' });

    const res = await request(app)
      .put('/api/notes/1')
      .send({ title: 'Updated', content: 'New content' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Updated');
    expect(res.body.data.content).toBe('New content');
  });

  it('preserves the original id and createdAt after update', async () => {
    const created = await request(app)
      .post('/api/notes')
      .send({ title: 'Original' });

    const updated = await request(app)
      .put('/api/notes/1')
      .send({ title: 'Changed' });

    expect(updated.body.data.id).toBe(created.body.data.id);
    expect(updated.body.data.createdAt).toBe(created.body.data.createdAt);
  });

  it('returns 404 for a non-existent note', async () => {
    const res = await request(app)
      .put('/api/notes/999')
      .send({ title: 'Ghost' });

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when title is missing', async () => {
    await request(app).post('/api/notes').send({ title: 'Original' });

    const res = await request(app)
      .put('/api/notes/1')
      .send({ content: 'No title' });

    expect(res.statusCode).toBe(400);
  });
});

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────

describe('DELETE /api/notes/:id', () => {
  it('deletes an existing note', async () => {
    await request(app).post('/api/notes').send({ title: 'Delete Me' });

    const res = await request(app).delete('/api/notes/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/1/);
  });

  it('note no longer exists after deletion', async () => {
    await request(app).post('/api/notes').send({ title: 'Delete Me' });
    await request(app).delete('/api/notes/1');

    const res = await request(app).get('/api/notes/1');
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 when deleting non-existent note', async () => {
    const res = await request(app).delete('/api/notes/999');
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).delete('/api/notes/abc');
    expect(res.statusCode).toBe(400);
  });
});