import { config } from './config.js';
import { listPublishedEvents } from './events.js';
import { formatOffsetIso } from './format.js';
import { eventMetrics } from './metrics.js';

export async function registerPartnerRoutes(app) {
  app.addHook('onRequest', async (request, reply) => {
    if (request.headers['x-api-key'] !== config.partnerApiKey) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });

  app.get('/events', async () => {
    const events = [];
    for (const event of await listPublishedEvents()) {
      const metrics = await eventMetrics(null, event.id);
      if (metrics?.status !== 'published') continue;
      events.push({
        id: event.id,
        name: event.name,
        startsAt: formatOffsetIso(event.starts_at),
        priceCents: metrics.priceCents,
        availableSeats: metrics.available,
      });
    }
    return events;
  });
}
