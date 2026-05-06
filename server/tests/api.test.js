const request = require('supertest');
const app = require('..'); // Adjust path as needed

describe('API Health Checks', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
  });

  test('GET /ready should return ready status', async () => {
    const response = await request(app)
      .get('/ready')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body).toHaveProperty('services');
  });

  test('GET /metrics should return performance metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('uptime');
  });
});

describe('Authentication Endpoints', () => {
  test('POST /send-password-reset-email should validate email', async () => {
    const response = await request(app)
      .post('/send-password-reset-email')
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid email format');
  });

  test('POST /send-password-reset-email should accept valid email', async () => {
    const response = await request(app)
      .post('/send-password-reset-email')
      .send({ email: 'test@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});

describe('Error Handling', () => {
  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});