import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fastify from 'fastify';
import { researchRoutes } from '../../src/routes/research.routes';

describe('Research API Routes Integration Tests', () => {
  const app = fastify();

  before(async () => {
    process.env.RESEARCH_API_KEY = 'test-research-key';
    await app.register(researchRoutes);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /api/v1/health returns 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health'
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, 'ok');
  });

  test('POST /api/v1/research validates input and returns 400 on invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/research',
      payload: {
        companyName: '' // invalid empty name
      },
      headers: { authorization: 'Bearer test-research-key' },
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.error, 'VALIDATION_ERROR');
  });
});
