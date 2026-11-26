import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { config } from './config.js';
import { registerPartnerRoutes } from './partner.js';
import { registerRoutes } from './routes.js';
import { startWorker, stopWorker } from './worker.js';
import { layout } from './html.js';

export async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cookie, { secret: config.sessionSecret });
  await app.register(formbody);
  registerRoutes(app);
  app.setErrorHandler((error, _request, reply) => {
    console.error(error);
    reply.code(500).type('text/html; charset=utf-8').send(layout('Erro', '<h1>Erro interno.</h1>', null));
  });
  await app.register(registerPartnerRoutes, { prefix: '/api/partner' });
  startWorker();
  app.addHook('onClose', async () => {
    stopWorker();
  });
  return app;
}
