import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { config } from '../src/config.js';
import { registerPartnerRoutes } from '../src/partner.js';

const url = '/api/partner/events/missing/purchases';

test('chave é validada antes do parser, e JSON inválido devolve o erro do contrato', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  await app.register(registerPartnerRoutes, { prefix: '/api/partner' });

  const invalidJson = {
    method: 'POST',
    url,
    headers: { 'content-type': 'application/json' },
    payload: '{"buyerEmail":',
  };
  for (const key of [undefined, 'chave-incorreta']) {
    const headers = { ...invalidJson.headers };
    if (key !== undefined) headers['x-api-key'] = key;
    const response = await app.inject({ ...invalidJson, headers });
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: 'unauthorized' });
  }

  const headers = { ...invalidJson.headers, 'x-api-key': config.partnerApiKey };
  for (const payload of [invalidJson.payload, '{}', '{"buyerEmail":"ana@example.com","cardNumber":"123"}']) {
    const response = await app.inject({ ...invalidJson, headers, payload });
    assert.equal(response.statusCode, 422);
    assert.deepEqual(response.json(), { error: 'invalid_request' });
  }
});
