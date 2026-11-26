import './env.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { config } from '../src/config.js';
import { pool, migrate } from '../src/db.js';
import { formatDateTimeLocal } from '../src/format.js';
import { seed, SEED_CREDENTIALS } from '../src/seed.js';

const KEY = config.partnerApiKey;
const FAST_MAX = Number(process.env.GATEWAY_FAST_MAX_MS);
const SLOW_MIN = Number(process.env.GATEWAY_SLOW_MIN_MS);
const SLOW_MAX = Number(process.env.GATEWAY_SLOW_MAX_MS);
const CARD_OK = '4000000000000001';
const CARD_SLOW_OK = '4000000000000003';
const CARD_SLOW_NO = '4000000000000004';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function futureInput() {
  return formatDateTimeLocal(new Date(Date.now() + 40 * 24 * 60 * 60 * 1000));
}

function pastInput() {
  return formatDateTimeLocal(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
}

function cookieHeader(response) {
  const raw = response.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((item) => item.split(';')[0]).join('; ');
}

function field(html, id) {
  const match = html.match(new RegExp(`id="${id}">([^<]*)`));
  assert.ok(match, `campo ${id} ausente em ${html.slice(0, 400)}`);
  return match[1];
}

let app;

before(async () => {
  await migrate();
  app = await buildApp();
});

after(async () => {
  if (app) await app.close();
  await pool.end();
});

async function reset() {
  await pool.query('TRUNCATE tickets, events, sessions, users CASCADE');
  await seed();
  await seed();
}

async function login(email, password) {
  const response = await app.inject({
    method: 'POST',
    url: '/login',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams({ email, password }).toString(),
  });
  assert.equal(response.statusCode, 303, response.body);
  return cookieHeader(response);
}

function form(fields) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams(fields).toString(),
  };
}

async function createDraft(cookie, fields) {
  const response = await app.inject({
    url: '/organizer/events',
    cookies: undefined,
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    payload: new URLSearchParams(fields).toString(),
  });
  return response;
}

async function publish(cookie, eventId) {
  const response = await app.inject({
    method: 'POST',
    url: `/organizer/events/${eventId}/publish`,
    headers: { cookie },
  });
  assert.equal(response.statusCode, 303, response.body);
}

async function makePublished(cookie, fields) {
  const created = await createDraft(cookie, fields);
  assert.equal(created.statusCode, 303, created.body);
  const eventId = created.headers.location.split('/').pop();
  await publish(cookie, eventId);
  return eventId;
}

async function partnerBuy(eventId, email, cardNumber) {
  return app.inject({
    method: 'POST',
    url: `/api/partner/events/${eventId}/purchases`,
    headers: { 'x-api-key': KEY, 'content-type': 'application/json' },
    payload: { buyerEmail: email, cardNumber },
  });
}

async function ticketOf(ticketId) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/partner/tickets/${ticketId}`,
    headers: { 'x-api-key': KEY },
  });
  assert.equal(response.statusCode, 200, response.body);
  return response.json();
}

async function waitTicket(ticketId, status) {
  const deadline = Date.now() + SLOW_MAX + 2000;
  let last = null;
  while (Date.now() < deadline) {
    last = await ticketOf(ticketId);
    if (last.status === status) return last;
    await sleep(40);
  }
  assert.fail(`ingresso ${ticketId} ficou ${last?.status}, esperado ${status}`);
}

test('regras da Catraca', { timeout: 180000 }, async (t) => {
  await t.test('cadastro, sessões e criação de eventos restrita (R13)', async () => {
    await reset();
    const a = SEED_CREDENTIALS.organizerA;
    const organizer = await login(a.email, a.password);
    const list = await app.inject({ url: '/organizer/events', headers: { cookie: organizer } });
    assert.equal(list.statusCode, 200);
    const privateName = 'Evento exclusivo de A';
    const eventId = await makePublished(organizer, {
      name: privateName, startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00',
    });
    const email = 'novo@example.com';
    const password = 'senha-teste';
    const request = form({ name: 'Novo', email, password, role: 'organizer' });
    const registered = await app.inject({ ...request, url: '/register' });
    assert.equal(registered.statusCode, 303);
    const participant = await login(email, password);
    const restricted = await app.inject({ url: '/organizer/events', headers: { cookie: participant } });
    assert.equal(restricted.statusCode, 403);
    assert.ok(!restricted.body.includes(privateName));
    const account = await pool.query('SELECT role FROM users WHERE email = $1', [email]);
    assert.equal(account.rows[0].role, 'participant');
    const logout = await app.inject({ method: 'POST', url: '/logout', headers: { cookie: organizer } });
    assert.equal(logout.statusCode, 303);
    for (const headers of [{}, { cookie: organizer }]) {
      const denied = await app.inject({ url: `/organizer/events/${eventId}`, headers });
      assert.equal(denied.statusCode, 403);
      assert.ok(!denied.body.includes(privateName));
      assert.doesNotMatch(denied.body, /Confirmados/);
    }
    const fields = form({ name: 'Sem Sessão', startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00' });
    const blocked = await app.inject({ ...fields, url: '/organizer/events' });
    assert.equal(blocked.statusCode, 403);
    const events = await pool.query('SELECT id FROM events WHERE name = $1', ['Sem Sessão']);
    assert.equal(events.rowCount, 0);
    const home = await app.inject({ url: '/' });
    assert.doesNotMatch(home.body, /Sem Sessão/);
    const api = await app.inject({ url: '/api/partner/events', headers: { 'x-api-key': KEY } });
    assert.ok(!api.json().some(event => event.name === 'Sem Sessão'));
  });

  await t.test('rascunho fica fora da vitrine e da API; publicado entra (R02)', async () => {
    await reset();
    const cookie = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const name = 'Rascunho Jazz';
    const created = await createDraft(cookie, {
      name, startsAt: futureInput(), venue: 'Porão', capacity: '2', price: '100,00',
    });
    assert.equal(created.statusCode, 303, created.body);
    const eventId = created.headers.location.split('/').pop();
    const home = await app.inject({ method: 'GET', url: '/' });
    assert.equal(home.body.includes(name), false);
    const hidden = await app.inject({ method: 'GET', url: '/api/partner/events', headers: { 'x-api-key': KEY } });
    assert.equal(hidden.json().some((event) => event.id === eventId), false);
    const participantCredentials = SEED_CREDENTIALS.participant;
    const participant = await login(participantCredentials.email, participantCredentials.password);
    const deniedApi = await partnerBuy(eventId, 'draft@example.com', CARD_OK);
    assert.equal(deniedApi.statusCode, 404);
    assert.deepEqual(deniedApi.json(), { error: 'event_not_available' });
    const web = form({ cardNumber: CARD_OK });
    const deniedWeb = await app.inject({
      ...web, url: `/events/${eventId}/purchase`, headers: { ...web.headers, cookie: participant },
    });
    assert.equal(deniedWeb.statusCode, 404);
    assert.equal((await pool.query('SELECT id FROM tickets WHERE event_id = $1', [eventId])).rowCount, 0);
    await publish(cookie, eventId);
    const listed = await app.inject({ method: 'GET', url: '/api/partner/events', headers: { 'x-api-key': KEY } });
    const event = listed.json().find((item) => item.id === eventId);
    assert.equal(event.name, name);
    assert.equal(event.priceCents, 10000);
    assert.equal(event.availableSeats, 2);
    assert.match(event.startsAt, /T\d{2}:\d{2}:\d{2}-03:00$/);
    const vitrine = await app.inject({ method: 'GET', url: '/' });
    assert.equal(vitrine.body.includes(name), true);
  });

  await t.test('data no passado é rejeitada na criação e na edição (R01)', async () => {
    await reset();
    const cookie = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const valid = { name: 'Dados inválidos', startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00' };
    for (const fields of [{ ...valid, capacity: '0' }, { ...valid, price: '0' }]) {
      assert.equal((await createDraft(cookie, fields)).statusCode, 422);
    }
    assert.equal((await pool.query('SELECT id FROM events')).rowCount, 0);
    const rejected = await createDraft(cookie, {
      name: 'Ontem', startsAt: pastInput(), venue: 'Bar', capacity: '1', price: '10,00',
    });
    assert.equal(rejected.statusCode, 422);
    assert.match(rejected.body, /futuro/);
    const list = await app.inject({ method: 'GET', url: '/organizer/events', headers: { cookie } });
    assert.equal(list.body.includes('Ontem'), false);
    const eventId = await makePublished(cookie, {
      name: 'Amanhã', startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00',
    });
    const edited = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}`,
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({
        name: 'Amanhã', startsAt: pastInput(), venue: 'Bar', capacity: '1', price: '10,00',
      }).toString(),
    });
    assert.equal(edited.statusCode, 422);
    assert.match(edited.body, /futuro/);
  });

  await t.test('data inexistente é rejeitada na criação e na edição (R01)', async () => {
    await reset();
    const cookie = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const original = {
      name: 'Data válida', startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00',
    };
    const invalid = {
      ...original, name: 'Data inexistente', startsAt: `${new Date().getUTCFullYear() + 1}-02-30T12:00`,
    };
    const rejected = await createDraft(cookie, invalid);
    assert.equal(rejected.statusCode, 422);
    const eventId = await makePublished(cookie, original);
    const request = form(invalid);
    const edited = await app.inject({
      ...request,
      url: `/organizer/events/${eventId}`,
      headers: { ...request.headers, cookie },
    });
    assert.equal(edited.statusCode, 422);
    const { rows } = await pool.query('SELECT id, name, starts_at FROM events');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, eventId);
    assert.equal(rows[0].name, original.name);
    assert.equal(formatDateTimeLocal(rows[0].starts_at), original.startsAt);
  });

  await t.test('compra nasce pendente, confirma e aparece em Meus ingressos (R06 R08 R09)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const eventId = await makePublished(organizer, {
      name: 'Show Pendente', startsAt: futureInput(), venue: 'Bar', capacity: '2', price: '100,00',
    });
    const registered = await app.inject({
      ...form({ name: 'Ana', email: 'ana.nova@example.com', password: 'segredo1' }),
      url: '/register',
    });
    assert.equal(registered.statusCode, 303);
    const participant = cookieHeader(registered);
    const invalidCard = form({ cardNumber: '123' });
    const invalidWeb = await app.inject({
      ...invalidCard, url: `/events/${eventId}/purchase`, headers: { ...invalidCard.headers, cookie: participant },
    });
    assert.equal(invalidWeb.statusCode, 422);
    const invalidApi = await partnerBuy(eventId, 'invalido@example.com', '123');
    assert.equal(invalidApi.statusCode, 422);
    assert.deepEqual(invalidApi.json(), { error: 'invalid_request' });
    assert.equal((await pool.query('SELECT id FROM tickets WHERE event_id = $1', [eventId])).rowCount, 0);
    const bought = await app.inject({
      ...form({ cardNumber: CARD_OK }),
      url: `/events/${eventId}/purchase`,
      headers: { cookie: participant, 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(bought.statusCode, 303);
    const pendingPage = await app.inject({ method: 'GET', url: '/me/tickets', headers: { cookie: participant } });
    assert.match(pendingPage.body, /Show Pendente/);
    assert.match(pendingPage.body, /pendente/);
    assert.match(pendingPage.body, /class="code">[A-Z0-9]{8}</);
    await sleep(FAST_MAX + 800);
    const confirmedPage = await app.inject({ method: 'GET', url: '/me/tickets', headers: { cookie: participant } });
    assert.match(confirmedPage.body, /confirmado/);
    assert.doesNotMatch(confirmedPage.body, /pendente/);
    const other = SEED_CREDENTIALS.participant;
    const otherCookie = await login(other.email, other.password);
    const otherPage = await app.inject({ url: '/me/tickets', headers: { cookie: otherCookie } });
    assert.equal(otherPage.statusCode, 200);
    assert.doesNotMatch(otherPage.body, /Show Pendente|class="code"/);
  });

  await t.test('pendente ocupa vaga e recusa devolve a vaga (R05 R06 R08)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const eventId = await makePublished(organizer, {
      name: 'Uma Vaga', startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '20,00',
    });
    const pending = await partnerBuy(eventId, 'lento@example.com', CARD_SLOW_NO);
    assert.equal(pending.statusCode, 202);
    assert.equal(pending.json().status, 'pending');
    const blocked = await partnerBuy(eventId, 'outro@example.com', CARD_OK);
    assert.equal(blocked.statusCode, 409);
    assert.deepEqual(blocked.json(), { error: 'sold_out' });
    assert.equal((await pool.query('SELECT id FROM tickets WHERE event_id = $1', [eventId])).rowCount, 1);
    const page = await app.inject({ method: 'GET', url: `/events/${eventId}` });
    assert.match(page.body, /Ingressos esgotados/);
    await waitTicket(pending.json().ticketId, 'declined');
    const freed = await partnerBuy(eventId, 'depois@example.com', CARD_OK);
    assert.equal(freed.statusCode, 202);
    await waitTicket(freed.json().ticketId, 'confirmed');
  });

  await t.test('concorrência não passa da lotação (R07)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    for (const name of ['Carga A', 'Carga B', 'Carga C']) {
      const eventId = await makePublished(organizer, {
        name, startsAt: futureInput(), venue: 'Bar', capacity: '5', price: '10,00',
      });
      const responses = await Promise.all(Array.from({ length: 30 }, (_, index) => (
        partnerBuy(eventId, `carga${index}@example.com`, CARD_OK)
      )));
      const codes = responses.map((response) => response.statusCode).sort();
      assert.equal(codes.filter((code) => code === 202).length, 5, `${name}: ${codes.join(',')}`);
      assert.equal(codes.filter((code) => code === 409).length, 25, `${name}: ${codes.join(',')}`);
      const stored = await pool.query('SELECT count(*)::int AS n FROM tickets WHERE event_id = $1', [eventId]);
      assert.equal(stored.rows[0].n, 5);
      await sleep(FAST_MAX + 800);
      const panel = await app.inject({
        method: 'GET',
        url: `/organizer/events/${eventId}`,
        headers: { cookie: organizer },
      });
      assert.equal(field(panel.body, 'm-confirmados'), '5');
      assert.equal(field(panel.body, 'm-vagas'), '0');
    }
  });

  await t.test('lotação, preço vigente e painel (R03 R12)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const eventId = await makePublished(organizer, {
      name: 'Preco', startsAt: futureInput(), venue: 'Bar', capacity: '2', price: '100,00',
    });
    const first = await partnerBuy(eventId, 'p1@example.com', CARD_OK);
    const second = await partnerBuy(eventId, 'p2@example.com', CARD_OK);
    await waitTicket(first.json().ticketId, 'confirmed');
    await waitTicket(second.json().ticketId, 'confirmed');
    const startsAt = futureInput();
    const rejected = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}`,
      headers: { cookie: organizer, 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({ name: 'Preco', startsAt, venue: 'Bar', capacity: '1', price: '100,00' }).toString(),
    });
    assert.equal(rejected.statusCode, 422);
    assert.match(rejected.body, /lotação/);
    assert.match(rejected.body, /value="2"/);
    const accepted = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}`,
      headers: { cookie: organizer, 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({ name: 'Preco', startsAt, venue: 'Bar', capacity: '3', price: '150,00' }).toString(),
    });
    assert.equal(accepted.statusCode, 303, accepted.body);
    const third = await partnerBuy(eventId, 'p3@example.com', CARD_OK);
    assert.equal(third.statusCode, 202);
    await waitTicket(third.json().ticketId, 'confirmed');
    const panel = await app.inject({
      method: 'GET',
      url: `/organizer/events/${eventId}`,
      headers: { cookie: organizer },
    });
    assert.equal(field(panel.body, 'm-confirmados'), '3');
    assert.equal(field(panel.body, 'm-pendentes'), '0');
    assert.equal(field(panel.body, 'm-checkins'), '0');
    assert.equal(field(panel.body, 'm-vagas'), '0');
    assert.equal(field(panel.body, 'm-receita'), 'R$ 350,00');
    assert.equal(field(panel.body, 'm-estornados'), '0');

    const mixed = { name: 'Dois preços', startsAt, venue: 'Bar', capacity: '2', price: '100,00' };
    const mixedId = await makePublished(organizer, mixed);
    const oldPrice = await partnerBuy(mixedId, 'antigo@example.com', CARD_OK);
    assert.equal(oldPrice.statusCode, 202);
    await waitTicket(oldPrice.json().ticketId, 'confirmed');
    const editedPrice = form({ ...mixed, capacity: '3', price: '150,00' });
    const editedMixed = await app.inject({
      ...editedPrice, url: `/organizer/events/${mixedId}`, headers: { ...editedPrice.headers, cookie: organizer },
    });
    assert.equal(editedMixed.statusCode, 303);
    const newPrice = await partnerBuy(mixedId, 'novo@example.com', CARD_OK);
    assert.equal(newPrice.statusCode, 202);
    await waitTicket(newPrice.json().ticketId, 'confirmed');
    const mixedPanel = await app.inject({ url: `/organizer/events/${mixedId}`, headers: { cookie: organizer } });
    assert.equal(field(mixedPanel.body, 'm-receita'), 'R$ 250,00');
  });

  await t.test('check-in segue a ordem das mensagens (R10)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const other = await login(SEED_CREDENTIALS.organizerB.email, SEED_CREDENTIALS.organizerB.password);
    const eventId = await makePublished(organizer, {
      name: 'Porta', startsAt: futureInput(), venue: 'Bar', capacity: '3', price: '10,00',
    });
    const otherId = await makePublished(other, {
      name: 'Outro', startsAt: futureInput(), venue: 'Rua', capacity: '1', price: '10,00',
    });
    const ok = await partnerBuy(eventId, 'ok@example.com', CARD_OK);
    const declineStarted = Date.now();
    const declined = await partnerBuy(eventId, 'no@example.com', '4000000000000002');
    const foreign = await partnerBuy(otherId, 'foreign@example.com', CARD_OK);
    await waitTicket(ok.json().ticketId, 'confirmed');
    assert.equal((await waitTicket(declined.json().ticketId, 'declined')).checkedIn, false);
    assert.ok(Date.now() - declineStarted <= FAST_MAX + 1000, 'recusa fora da janela rápida dos gates');
    const available = await app.inject({ url: '/api/partner/events', headers: { 'x-api-key': KEY } });
    assert.equal(available.json().find(event => event.id === eventId).availableSeats, 2);
    await waitTicket(foreign.json().ticketId, 'confirmed');
    async function scan(cookie, id, code) {
      const response = await app.inject({
        method: 'POST',
        url: `/organizer/events/${id}/checkin`,
        headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
        payload: new URLSearchParams({ code }).toString(),
      });
      assert.equal(response.statusCode, 200);
      return field(response.body, 'checkin-result');
    }
    assert.equal(await scan(organizer, eventId, ok.json().code), 'Entrada liberada');
    assert.equal(await scan(organizer, eventId, ok.json().code), 'Ingresso já utilizado');
    assert.equal(await scan(organizer, eventId, declined.json().code), 'Ingresso não confirmado');
    assert.equal(await scan(organizer, eventId, 'ZZZZZZZZ'), 'Ingresso inválido para este evento');
    assert.equal(await scan(organizer, eventId, foreign.json().code), 'Ingresso inválido para este evento');
    const panel = await app.inject({
      method: 'GET', url: `/organizer/events/${eventId}`, headers: { cookie: organizer },
    });
    assert.equal(field(panel.body, 'm-checkins'), '1');
  });

  await t.test('cancelamento estorna, trava edição e ignora o gateway (R11 R12)', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const eventId = await makePublished(organizer, {
      name: 'Cancelavel', startsAt: futureInput(), venue: 'Bar', capacity: '5', price: '50,00',
    });
    const slow = await partnerBuy(eventId, 'slow@example.com', CARD_SLOW_OK);
    const fast = await partnerBuy(eventId, 'fast@example.com', CARD_OK);
    assert.equal(slow.statusCode, 202);
    await waitTicket(fast.json().ticketId, 'confirmed');
    const checkinRequest = form({ code: fast.json().code });
    const admitted = await app.inject({
      ...checkinRequest,
      url: `/organizer/events/${eventId}/checkin`,
      headers: { ...checkinRequest.headers, cookie: organizer },
    });
    assert.equal(admitted.statusCode, 200);
    assert.equal(field(admitted.body, 'checkin-result'), 'Entrada liberada');
    assert.equal(field(admitted.body, 'm-checkins'), '1');
    assert.equal((await ticketOf(slow.json().ticketId)).status, 'pending');
    const cancelled = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}/cancel`,
      headers: { cookie: organizer },
    });
    assert.equal(cancelled.statusCode, 303);
    await sleep(200);
    const refunded = await ticketOf(fast.json().ticketId);
    assert.equal(refunded.status, 'refunded');
    assert.equal(refunded.checkedIn, true);
    assert.equal((await ticketOf(slow.json().ticketId)).status, 'cancelled');
    const home = await app.inject({ method: 'GET', url: '/' });
    assert.equal(home.body.includes('Cancelavel'), false);
    const listed = await app.inject({
      method: 'GET', url: '/api/partner/events', headers: { 'x-api-key': KEY },
    });
    assert.equal(listed.json().some((event) => event.id === eventId), false);
    const buy = await partnerBuy(eventId, 'tarde@example.com', CARD_OK);
    assert.equal(buy.statusCode, 404);
    assert.deepEqual(buy.json(), { error: 'event_not_available' });
    const startsAt = futureInput();
    const edited = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}`,
      headers: { cookie: organizer, 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({
        name: 'Nome novo', startsAt, venue: 'Outro', capacity: '9', price: '9,00',
      }).toString(),
    });
    assert.equal(edited.body.includes('name="capacity"'), false);
    const page = await app.inject({
      method: 'GET', url: `/organizer/events/${eventId}`, headers: { cookie: organizer },
    });
    assert.match(page.body, /id="event-name">Cancelavel</);
    assert.equal(page.body.includes('name="capacity"'), false);
    assert.equal(field(page.body, 'm-confirmados'), '0');
    assert.equal(field(page.body, 'm-pendentes'), '0');
    assert.equal(field(page.body, 'm-checkins'), '0');
    assert.equal(field(page.body, 'm-vagas'), '0');
    assert.equal(field(page.body, 'm-receita'), 'R$ 0,00');
    assert.equal(field(page.body, 'm-estornados'), '1');
    const checkin = await app.inject({
      method: 'POST',
      url: `/organizer/events/${eventId}/checkin`,
      headers: { cookie: organizer, 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({ code: fast.json().code }).toString(),
    });
    assert.equal(field(checkin.body, 'checkin-result'), 'Evento cancelado');
    await sleep(SLOW_MAX + 500);
    assert.equal((await ticketOf(slow.json().ticketId)).status, 'cancelled');
    assert.equal((await ticketOf(fast.json().ticketId)).status, 'refunded');
  });

  await t.test('organizador só vê os próprios eventos (R13)', async () => {
    await reset();
    const organizerA = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const secret = 'SEGREDO-R13-UNICO';
    const eventId = await makePublished(organizerA, {
      name: secret, startsAt: futureInput(), venue: 'Bar', capacity: '1', price: '10,00',
    });
    const organizerB = await login(SEED_CREDENTIALS.organizerB.email, SEED_CREDENTIALS.organizerB.password);
    const list = await app.inject({ method: 'GET', url: '/organizer/events', headers: { cookie: organizerB } });
    assert.equal(list.body.includes(secret), false);
    const direct = await app.inject({
      method: 'GET', url: `/organizer/events/${eventId}`, headers: { cookie: organizerB },
    });
    assert.equal(direct.statusCode, 404);
    assert.equal(direct.body.includes(secret), false);
    assert.equal(direct.body.includes('Confirmados'), false);
    const participant = await login(SEED_CREDENTIALS.participant.email, SEED_CREDENTIALS.participant.password);
    const asParticipant = await app.inject({
      method: 'GET', url: `/organizer/events/${eventId}`, headers: { cookie: participant },
    });
    assert.equal(asParticipant.statusCode, 403);
    assert.equal(asParticipant.body.includes(secret), false);
    const asVisitor = await app.inject({ method: 'GET', url: `/organizer/events/${eventId}` });
    assert.equal(asVisitor.statusCode, 403);
    assert.equal(asVisitor.body.includes(secret), false);
  });

  await t.test('contrato da API de parceiros', async () => {
    await reset();
    const organizer = await login(SEED_CREDENTIALS.organizerA.email, SEED_CREDENTIALS.organizerA.password);
    const eventId = await makePublished(organizer, {
      name: 'API', startsAt: futureInput(), venue: 'Bar', capacity: '2', price: '80,00',
    });
    for (const url of ['/api/partner/events', `/api/partner/events/${eventId}/purchases`, '/api/partner/tickets/tkt_missing']) {
      const missing = await app.inject({ method: url.endsWith('purchases') ? 'POST' : 'GET', url, payload: url.endsWith('purchases') ? {} : undefined });
      assert.equal(missing.statusCode, 401, url);
      assert.deepEqual(missing.json(), { error: 'unauthorized' });
      const wrong = await app.inject({
        method: url.endsWith('purchases') ? 'POST' : 'GET',
        url,
        headers: { 'x-api-key': 'chave-errada', 'content-type': 'application/json' },
        payload: url.endsWith('purchases') ? { buyerEmail: 'a@b.co', cardNumber: CARD_OK } : undefined,
      });
      assert.equal(wrong.statusCode, 401, url);
      assert.deepEqual(wrong.json(), { error: 'unauthorized' });
    }
    const invalid = await partnerBuy('evt_nao_existe', 'ana@example.com', '123');
    assert.equal(invalid.statusCode, 422);
    assert.deepEqual(invalid.json(), { error: 'invalid_request' });
    const absent = await app.inject({
      method: 'POST', url: '/api/partner/events/evt_nao_existe/purchases', headers: { 'x-api-key': KEY },
    });
    assert.equal(absent.statusCode, 422);
    assert.deepEqual(absent.json(), { error: 'invalid_request' });
    const badEmail = await partnerBuy('evt_nao_existe', 'ana', CARD_OK);
    assert.equal(badEmail.statusCode, 422);
    assert.deepEqual(badEmail.json(), { error: 'invalid_request' });
    const missingEvent = await partnerBuy('evt_nao_existe', 'ana@example.com', CARD_OK);
    assert.equal(missingEvent.statusCode, 404);
    assert.deepEqual(missingEvent.json(), { error: 'event_not_available' });
    const bought = await partnerBuy(eventId, 'ana@example.com', CARD_OK);
    assert.equal(bought.statusCode, 202);
    const body = bought.json();
    assert.equal(body.status, 'pending');
    assert.match(body.ticketId, /^tkt_/);
    assert.match(body.code, /^[A-Z0-9]{8}$/);
    const unknown = await app.inject({
      method: 'GET', url: '/api/partner/tickets/tkt_missing', headers: { 'x-api-key': KEY },
    });
    assert.equal(unknown.statusCode, 404);
    assert.deepEqual(unknown.json(), { error: 'ticket_not_found' });
    const dto = await waitTicket(body.ticketId, 'confirmed');
    assert.equal(dto.checkedIn, false);
    assert.equal(dto.eventId, eventId);
    assert.equal(dto.ticketId, body.ticketId);
    assert.equal(dto.code, body.code);
    const panel = await app.inject({
      method: 'GET', url: `/organizer/events/${eventId}`, headers: { cookie: organizer },
    });
    assert.equal(field(panel.body, 'm-confirmados'), '1');
    assert.equal(field(panel.body, 'm-receita'), 'R$ 80,00');
  });
});
