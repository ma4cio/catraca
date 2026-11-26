import { isCardNumber } from './format.js';
import {
  eventPage,
  eventForm,
  layout,
  managementPage,
  organizerListPage,
  storefrontPage,
  ticketsPage,
} from './html.js';
import { currentUser, authenticate, closeSession, openSession, registerParticipant } from './users.js';
import {
  createEvent,
  getEvent,
  listOwnedEvents,
  listPublishedEvents,
  publishEvent,
  readEventInput,
  updateEvent,
} from './events.js';
import { eventMetrics } from './metrics.js';
import { listTicketsForUser, purchaseTicket } from './purchases.js';

function sendHtml(reply, status, html) {
  return reply.code(status).type('text/html; charset=utf-8').send(html);
}

function redirect(reply, url) {
  return reply.code(303).header('location', url).send();
}

function setSession(reply, sid) {
  reply.setCookie('sid', sid, { path: '/', httpOnly: true, sameSite: 'lax' });
}

async function requireUser(request, reply) {
  const user = await currentUser(request);
  if (!user) {
    redirect(reply, '/login');
    return null;
  }
  return user;
}

async function requireOrganizer(request, reply) {
  const user = await currentUser(request);
  if (!user || user.role !== 'organizer') {
    sendHtml(reply, 403, layout('Acesso negado', '<h1>Acesso negado</h1><p>Área restrita a organizadores.</p>', user));
    return null;
  }
  return user;
}

async function requireOwnedEvent(request, reply, eventId) {
  const user = await requireOrganizer(request, reply);
  if (!user) return null;
  const event = await getEvent(eventId);
  if (!event || event.organizer_id !== user.id) {
    sendHtml(reply, 404, layout('Evento não encontrado', '<h1>Evento não encontrado</h1><p>Evento não encontrado.</p>', user));
    return null;
  }
  return { user, event };
}

function inputErrorMessage(code) {
  if (code === 'past_date') return 'A data de início precisa estar no futuro.';
  if (code === 'capacity') return 'A lotação não pode ser menor que as vagas ocupadas.';
  return 'Preencha nome, local, data futura, lotação inteira maior que zero e preço maior que zero.';
}

export function registerRoutes(app) {
  app.get('/health', async () => ({ ok: true }));

  app.get('/', async (request, reply) => {
    const user = await currentUser(request);
    const events = await listPublishedEvents();
    const decorated = [];
    for (const event of events) {
      const metrics = await eventMetrics(null, event.id);
      decorated.push({ ...event, available: metrics.available });
    }
    return sendHtml(reply, 200, storefrontPage(user, decorated));
  });

  app.get('/register', async (request, reply) => {
    const user = await currentUser(request);
    return sendHtml(reply, 200, layout('Cadastrar', `<h1>Cadastrar</h1>
      <form method="post" action="/register">
        <label>Nome <input name="name" required></label>
        <label>E-mail <input name="email" type="email" required></label>
        <label>Senha <input name="password" type="password" required minlength="6"></label>
        <button type="submit">Criar conta</button>
      </form>`, user));
  });

  app.post('/register', async (request, reply) => {
    const result = await registerParticipant(request.body ?? {});
    if (result.error) {
      const message = result.error === 'email_taken' ? 'Este e-mail já está em uso.' : 'Dados inválidos.';
      return sendHtml(reply, 422, layout('Cadastrar', `<h1>Cadastrar</h1><p class="error">${message}</p>`, null));
    }
    setSession(reply, await openSession(result.user.id));
    return redirect(reply, '/me/tickets');
  });

  app.get('/login', async (request, reply) => {
    const user = await currentUser(request);
    return sendHtml(reply, 200, layout('Entrar', `<h1>Entrar</h1>
      <form method="post" action="/login">
        <label>E-mail <input name="email" type="email" required></label>
        <label>Senha <input name="password" type="password" required></label>
        <button type="submit">Entrar</button>
      </form>`, user));
  });

  app.post('/login', async (request, reply) => {
    const user = await authenticate(request.body?.email, request.body?.password);
    if (!user) {
      return sendHtml(reply, 401, layout('Entrar', '<h1>Entrar</h1><p class="error">E-mail ou senha inválidos.</p>', null));
    }
    setSession(reply, await openSession(user.id));
    return redirect(reply, user.role === 'organizer' ? '/organizer/events' : '/me/tickets');
  });

  app.post('/logout', async (request, reply) => {
    await closeSession(request.cookies?.sid);
    reply.clearCookie('sid', { path: '/' });
    return redirect(reply, '/');
  });

  app.get('/me/tickets', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== 'participant') {
      return sendHtml(reply, 403, layout('Acesso negado', '<h1>Acesso negado</h1>', user));
    }
    const tickets = await listTicketsForUser(user.id);
    return sendHtml(reply, 200, ticketsPage(user, tickets));
  });

  app.get('/events/:id', async (request, reply) => {
    const user = await currentUser(request);
    const event = await getEvent(request.params.id);
    if (!event || event.status !== 'published') {
      return sendHtml(reply, 404, layout('Evento não encontrado', '<h1>Evento não encontrado</h1>', user));
    }
    const metrics = await eventMetrics(null, event.id);
    return sendHtml(reply, 200, eventPage({ event, available: metrics.available, user }));
  });

  app.post('/events/:id/purchase', async (request, reply) => {
    const user = await currentUser(request);
    if (!user || user.role !== 'participant') {
      return redirect(reply, '/login');
    }
    const event = await getEvent(request.params.id);
    if (!event || event.status !== 'published') {
      return sendHtml(reply, 404, layout('Evento não encontrado', '<h1>Evento não encontrado</h1>', user));
    }
    const metrics = await eventMetrics(null, event.id);
    if (metrics.available <= 0) {
      return sendHtml(reply, 409, eventPage({ event, available: 0, user }));
    }
    const cardNumber = String(request.body?.cardNumber ?? '');
    if (!isCardNumber(cardNumber)) {
      return sendHtml(reply, 422, eventPage({
        event,
        available: metrics.available,
        user,
        message: 'O cartão deve ter 16 dígitos.',
      }));
    }
    const result = await purchaseTicket({
      eventId: event.id,
      buyerEmail: user.email,
      buyerUserId: user.id,
      channel: 'storefront',
      cardNumber,
    });
    if (result.error === 'sold_out') {
      return sendHtml(reply, 409, eventPage({ event, available: 0, user }));
    }
    if (result.error) {
      return sendHtml(reply, 404, layout('Evento não encontrado', '<h1>Evento não encontrado</h1>', user));
    }
    return redirect(reply, '/me/tickets');
  });

  app.get('/organizer/events', async (request, reply) => {
    const user = await requireOrganizer(request, reply);
    if (!user) return;
    const events = await listOwnedEvents(user.id);
    return sendHtml(reply, 200, organizerListPage(user, events));
  });

  app.get('/organizer/events/new', async (request, reply) => {
    const user = await requireOrganizer(request, reply);
    if (!user) return;
    return sendHtml(reply, 200, layout('Novo evento', `<h1>Novo evento</h1>${eventForm({}, '', '/organizer/events')}`, user));
  });

  app.post('/organizer/events', async (request, reply) => {
    const user = await requireOrganizer(request, reply);
    if (!user) return;
    const parsed = readEventInput(request.body ?? {});
    if (parsed.error) {
      return sendHtml(reply, 422, layout('Novo evento', `<h1>Novo evento</h1>${eventForm(request.body ?? {}, inputErrorMessage(parsed.error), '/organizer/events')}`, user));
    }
    const id = await createEvent(user.id, parsed.value);
    return redirect(reply, `/organizer/events/${id}`);
  });

  app.get('/organizer/events/:id', async (request, reply) => {
    const owned = await requireOwnedEvent(request, reply, request.params.id);
    if (!owned) return;
    const metrics = await eventMetrics(null, owned.event.id);
    return sendHtml(reply, 200, managementPage({ ...owned, metrics }));
  });

  app.post('/organizer/events/:id', async (request, reply) => {
    const owned = await requireOwnedEvent(request, reply, request.params.id);
    if (!owned) return;
    if (owned.event.status === 'cancelled') {
      const metrics = await eventMetrics(null, owned.event.id);
      return sendHtml(reply, 422, managementPage({ ...owned, metrics, error: 'Este evento está cancelado e não pode ser editado.' }));
    }
    const parsed = readEventInput(request.body ?? {});
    const metrics = await eventMetrics(null, owned.event.id);
    if (parsed.error) {
      return sendHtml(reply, 422, managementPage({
        user: owned.user,
        event: { ...owned.event, ...formOverlay(owned.event, request.body) },
        metrics,
        error: inputErrorMessage(parsed.error),
      }));
    }
    const result = await updateEvent(owned.event.id, owned.user.id, parsed.value);
    if (result.error === 'capacity') {
      return sendHtml(reply, 422, managementPage({ ...owned, metrics, error: inputErrorMessage('capacity') }));
    }
    if (result.error) {
      return sendHtml(reply, 422, managementPage({ ...owned, metrics, error: inputErrorMessage(result.error) }));
    }
    return redirect(reply, `/organizer/events/${owned.event.id}`);
  });

  app.post('/organizer/events/:id/publish', async (request, reply) => {
    const owned = await requireOwnedEvent(request, reply, request.params.id);
    if (!owned) return;
    const result = await publishEvent(owned.event.id, owned.user.id);
    if (result.error) {
      const metrics = await eventMetrics(null, owned.event.id);
      return sendHtml(reply, 422, managementPage({ ...owned, metrics, error: inputErrorMessage(result.error) }));
    }
    return redirect(reply, `/organizer/events/${owned.event.id}`);
  });

}

function formOverlay(event, body) {
  return {
    name: body?.name ?? event.name,
    venue: body?.venue ?? event.venue,
    capacity: Number(body?.capacity ?? event.capacity) || event.capacity,
    price_cents: event.price_cents,
    starts_at: event.starts_at,
    status: event.status,
    id: event.id,
    organizer_id: event.organizer_id,
  };
}
