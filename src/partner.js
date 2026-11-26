import { config } from './config.js';
import { listPublishedEvents } from './events.js';
import { formatOffsetIso, isCardNumber, isEmail } from './format.js';
import { eventMetrics } from './metrics.js';
import { getTicket, purchaseTicket, ticketDto } from './purchases.js';

const PURCHASE_ERRORS = {
  invalid_request: 422,
  event_not_available: 404,
  sold_out: 409,
};

function invalidRequest(reply) {
  return reply.code(422).send({ error: 'invalid_request' });
}

export async function registerPartnerRoutes(app) {
  app.addHook('onRequest', async (request, reply) => {
    if (request.headers['x-api-key'] !== config.partnerApiKey) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if ([400, 413, 415].includes(error.statusCode)) return invalidRequest(reply);
    console.error(error);
    return reply.code(500).send({ error: 'internal' });
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

  app.post('/events/:eventId/purchases', async (request, reply) => {
    const contentType = request.headers['content-type'] ?? '';
    const { buyerEmail, cardNumber } = request.body ?? {};
    if (!/^application\/json(?:\s*;|$)/i.test(contentType) || !isEmail(buyerEmail) || !isCardNumber(cardNumber)) {
      return invalidRequest(reply);
    }

    const result = await purchaseTicket({
      eventId: request.params.eventId,
      buyerEmail: buyerEmail.trim(),
      channel: 'partner',
      cardNumber,
    });
    if (result.error) return reply.code(PURCHASE_ERRORS[result.error]).send({ error: result.error });
    return reply.code(202).send(result);
  });

  app.get('/tickets/:ticketId', async (request, reply) => {
    const ticket = await getTicket(request.params.ticketId);
    if (!ticket) return reply.code(404).send({ error: 'ticket_not_found' });
    return ticketDto(ticket);
  });
}
