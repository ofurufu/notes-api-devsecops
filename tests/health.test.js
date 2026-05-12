const request = require('supertest')
const app = require('../src/app')

describe('Health Check', () => {
  test('GET /health returns 200 with healthy status', async () => {
    const res = await request(app).get('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('healthy')
    expect(res.body).toHaveProperty('uptime')
    expect(res.body).toHaveProperty('timestamp')
  })

  test('GET /unknown-route returns 404', async () => {
    const res = await request(app).get('/this-does-not-exist')
    expect(res.statusCode).toBe(404)
    expect(res.body.success).toBe(false)
  })
})