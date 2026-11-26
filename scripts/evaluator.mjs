import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { formatDateTimeLocal } from '../src/format.js';

const baseUrl = 'http://127.0.0.1:3000';
const key = 'partner_key_catraca_dev';
const api = '/api/partner';
const ok = '4000000000000001';
const runId = randomUUID().slice(0, 8);
const future = formatDateTimeLocal(new Date(Date.now() + 40 * 86400000));
const past = formatDateTimeLocal(new Date(Date.now() - 2 * 86400000));

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(baseUrl + path, {
    method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(10000),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: await response.text(),
    path,
  };
}

function expectStatus(response, status) {
  assert.equal(response.status, status, response.path + ' ' + response.body.slice(0, 300));
  return response;
}

function client(cookie) {
  return (path, fields) => request(path, {
    method: fields === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(fields === undefined ? {} : { 'content-type': 'application/x-www-form-urlencoded' }),
    },
    body: fields === undefined ? undefined : new URLSearchParams(fields),
  });
}

async function connect(action, fields) {
  const result = expectStatus(await client()('/' + action, fields), 303);
  const cookie = result.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  return client(cookie);
}

const login = (email, password) => connect('login', { email, password });
const eventInput = (label, capacity, price, startsAt = future) => ({
  name: label + ' ' + runId, venue: 'Bar de teste', capacity, price, startsAt,
});

async function draft(organizer, fields) {
  const result = expectStatus(await organizer('/organizer/events', fields), 303);
  const path = result.headers.get('location');
  assert.match(path, /^\/organizer\/events\/[^/]+$/);
  return { path, id: path.split('/').at(-1) };
}

async function publish(organizer, event) {
  expectStatus(await organizer(event.path + '/publish', {}), 303);
  return event;
}

function partner(path, { payload, apiKey = key } = {}) {
  const headers = apiKey ? { 'x-api-key': apiKey } : {};
  if (payload !== undefined) headers['content-type'] = 'application/json';
  return request(api + path, {
    headers, method: payload === undefined ? 'GET' : 'POST',
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

async function listed(event) {
  return JSON.parse(expectStatus(await partner('/events'), 200).body)
    .find(item => item.id === event.id);
}

const purchasePath = event => '/events/' + event.id + '/purchases';

async function buy(event, cardNumber = ok, buyer = 'parceiro') {
  return partner(purchasePath(event), { payload: { buyerEmail: buyer + '@example.com', cardNumber } });
}

async function ticket(ticketId) {
  return JSON.parse(expectStatus(await partner('/tickets/' + ticketId), 200).body);
}

async function accept(event, card, buyer) {
  const started = Date.now();
  const dto = JSON.parse(expectStatus(await buy(event, card, buyer), 202).body);
  assert.deepEqual(Object.keys(dto).sort(), ['code', 'status', 'ticketId']);
  assert.equal(dto.status, 'pending');
  return { ...dto, started };
}

async function until(read, matches, deadline) {
  let value;
  do {
    value = await read();
    if (matches(value)) {
      assert.ok(Date.now() <= deadline, 'Prazo excedido');
      return value;
    }
    await sleep(50);
  } while (Date.now() < deadline);
  assert.fail('Prazo excedido. Último resultado: ' + JSON.stringify(value).slice(0, 400));
}

function field(html, id) {
  const match = html.match(new RegExp('id="' + id + '">([^<]*)'));
  assert.ok(match, 'Elemento ausente: ' + id);
  return match[1];
}

function panel(html, expected) {
  for (const [id, value] of Object.entries(expected)) assert.equal(field(html, 'm-' + id), value);
}

async function checkin(organizer, event, code, expected) {
  const response = expectStatus(await organizer(event.path + '/checkin', { code }), 200);
  assert.equal(field(response.body, 'checkin-result'), expected);
  return response.body;
}

expectStatus(await request('/health'), 200);
const orgA = await login('ana.organizadora@catraca.local', 'senha-organizador-a');
if (process.argv.includes('--seed-only')) {
  await login('bruno.organizador@catraca.local', 'senha-organizador-b');
  await login('paula.participante@catraca.local', 'senha-participante');
  console.log('Contas da seed válidas após a nova subida');
  process.exit(0);
}
const details = eventInput('E1', 2, '100,00');
const e1 = await draft(orgA, details);
assert.ok(!(await client()('/')).body.includes(details.name));
assert.equal(await listed(e1), undefined);
expectStatus(await orgA('/organizer/events', eventInput('Passado', 1, '10,00', past)), 422);
await publish(orgA, e1);
assert.ok((await client()('/')).body.includes(details.name));
const visible = await listed(e1);
assert.deepEqual(Object.keys(visible).sort(), ['availableSeats', 'id', 'name', 'priceCents', 'startsAt']);
assert.equal(visible.availableSeats, 2);
assert.equal(visible.priceCents, 10000);
console.log('Passos 1–4: seed, rascunho, data e publicação');

const participant = await connect('register', {
  name: 'Participante ' + runId, email: runId + '@example.org', password: 'teste-catraca',
});
const storefrontStarted = Date.now();
expectStatus(await participant('/events/' + e1.id + '/purchase', { cardNumber: ok }), 303);
const pending = expectStatus(await participant('/me/tickets'), 200).body;
assert.ok(pending.includes(details.name));
assert.match(pending, /class="status">pendente</);
const c1 = pending.match(/class="code">([^<]+)/)?.[1];
assert.ok(c1);
await until(() => participant('/me/tickets'), r => /class="status">confirmado</.test(r.body), storefrontStarted + 5000);
const t2 = await accept(e1, '4000000000000004', 't2');
assert.equal((await listed(e1)).availableSeats, 0);
const sold = expectStatus(await buy(e1), 409);
assert.deepEqual(JSON.parse(sold.body), { error: 'sold_out' });
assert.match((await participant('/events/' + e1.id)).body, /Ingressos esgotados/);
assert.equal((await ticket(t2.ticketId)).status, 'pending');
assert.ok(Date.now() - t2.started < 30000);
await sleep(Math.max(0, t2.started + 45000 - Date.now()));
assert.equal((await ticket(t2.ticketId)).status, 'declined');
assert.equal((await listed(e1)).availableSeats, 1);
const t3 = await accept(e1, ok, 't3');
await until(() => ticket(t3.ticketId), t => t.status === 'confirmed', t3.started + 5000);
console.log('Passos 5–8: compra na vitrine, ocupação, esgotamento e recusa lenta');

expectStatus(await orgA(e1.path, { ...details, capacity: 1 }), 422);
expectStatus(await orgA(e1.path, { ...details, capacity: 3, price: '150,00' }), 303);
const t4 = await accept(e1, ok, 't4');
await until(() => ticket(t4.ticketId), t => t.status === 'confirmed', t4.started + 5000);
panel((await orgA(e1.path)).body, {
  confirmados: '3', pendentes: '0', checkins: '0', vagas: '0', receita: 'R$ 350,00', estornados: '0',
});
panel(await checkin(orgA, e1, c1, 'Entrada liberada'), { checkins: '1' });
await checkin(orgA, e1, c1, 'Ingresso já utilizado');
await checkin(orgA, e1, t2.code, 'Ingresso não confirmado');
await checkin(orgA, e1, 'ZZZZZZZZ', 'Ingresso inválido para este evento');
const orgB = await login('bruno.organizador@catraca.local', 'senha-organizador-b');
assert.ok(!(await orgB('/organizer/events')).body.includes(details.name));
const seededParticipant = await login('paula.participante@catraca.local', 'senha-participante');
for (const [visitor, status] of [[orgB, 404], [seededParticipant, 403], [client(), 403]]) {
  const page = expectStatus(await visitor(e1.path), status).body;
  assert.ok(!page.includes(details.name));
  assert.doesNotMatch(page, /m-confirmados|checkin-result/);
}
const e2 = await publish(orgB, await draft(orgB, eventInput('E2', 1, '20,00')));
const foreign = await accept(e2);
await checkin(orgA, e1, foreign.code, 'Ingresso inválido para este evento');
console.log('Passos 9–11: preço, painel, check-in e isolamento de acesso');

const e3Fields = eventInput('E3', 5, '50,00');
const e3 = await publish(orgA, await draft(orgA, e3Fields));
const t5 = await accept(e3, '4000000000000003', 't5');
const t6 = await accept(e3, ok, 't6');
await until(() => ticket(t6.ticketId), t => t.status === 'confirmed', t6.started + 5000);
expectStatus(await orgA(e3.path + '/cancel', {}), 303);
const cancelledAt = Date.now();
assert.ok(cancelledAt - t5.started < 30000);
assert.ok(!(await client()('/')).body.includes(e3Fields.name));
assert.equal(await listed(e3), undefined);
assert.deepEqual(JSON.parse(expectStatus(await buy(e3), 404).body), { error: 'event_not_available' });
await until(() => ticket(t6.ticketId), t => t.status === 'refunded', cancelledAt + 10000);
await until(() => ticket(t5.ticketId), t => t.status === 'cancelled', cancelledAt + 10000);
assert.doesNotMatch((await orgA(e3.path)).body, /name="capacity"/);
expectStatus(await orgA(e3.path, e3Fields), 422);
await sleep(Math.max(0, t5.started + 45000 - Date.now()));
assert.equal((await ticket(t5.ticketId)).status, 'cancelled');
assert.equal((await ticket(t6.ticketId)).status, 'refunded');
panel(await checkin(orgA, e3, t6.code, 'Evento cancelado'), {
  confirmados: '0', pendentes: '0', checkins: '0', vagas: '0', receita: 'R$ 0,00', estornados: '1',
});
console.log('Passos 12–14: cancelamento e resposta tardia do gateway');

for (const label of ['E4', 'E5']) {
  const event = await publish(orgA, await draft(orgA, eventInput(label, 5, '10,00')));
  const started = Date.now();
  const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => buy(event, ok, 'carga' + i)));
  assert.equal(responses.filter(r => r.status === 202).length, 5, label);
  assert.equal(responses.filter(r => r.status === 409).length, 25, label);
  const confirmed = await until(() => orgA(event.path), r => field(r.body, 'm-confirmados') === '5', started + 10000);
  panel(confirmed.body, { confirmados: '5', vagas: '0' });
  console.log(label + ': 5 x 202 e 25 x 409, cinco confirmados');
}

for (const apiKey of [null, 'errada']) {
  for (const [path, payload] of [['/events'], [purchasePath(e1), {}], ['/tickets/missing']]) {
    assert.deepEqual(JSON.parse(expectStatus(await partner(path, { apiKey, payload }), 401).body), { error: 'unauthorized' });
  }
}
assert.deepEqual(JSON.parse(expectStatus(await buy(e1, '123'), 422).body), { error: 'invalid_request' });
assert.deepEqual(JSON.parse(expectStatus(await partner('/tickets/missing'), 404).body), { error: 'ticket_not_found' });
console.log('Passos 15–16: concorrência e contrato de erros da API aprovados');
