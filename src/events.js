import { pool, withTransaction } from './db.js';
import { newId } from './crypto.js';
import { parseCapacity, parseReais, parseSaoPauloLocal } from './format.js';
import { eventMetrics } from './metrics.js';

export function readEventInput(body) {
  const name = String(body?.name ?? '').trim();
  const venue = String(body?.venue ?? '').trim();
  const startsAt = parseSaoPauloLocal(body?.startsAt);
  const capacity = parseCapacity(body?.capacity);
  const priceCents = parseReais(body?.price);
  if (name.length < 1 || name.length > 160) return { error: 'invalid' };
  if (venue.length < 1 || venue.length > 160) return { error: 'invalid' };
  if (!startsAt) return { error: 'invalid' };
  if (startsAt.getTime() <= Date.now()) return { error: 'past_date' };
  if (capacity === null) return { error: 'invalid' };
  if (priceCents === null) return { error: 'invalid' };
  return { value: { name, venue, startsAt, capacity, priceCents } };
}

export async function createEvent(organizerId, input) {
  const id = newId('evt_');
  await pool.query(
    `INSERT INTO events (id, organizer_id, name, starts_at, venue, capacity, price_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')`,
    [id, organizerId, input.name, input.startsAt.toISOString(), input.venue, input.capacity, input.priceCents],
  );
  return id;
}

export async function getEvent(id) {
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function listOwnedEvents(organizerId) {
  const result = await pool.query(
    'SELECT * FROM events WHERE organizer_id = $1 ORDER BY starts_at, name',
    [organizerId],
  );
  return result.rows;
}

export async function listPublishedEvents() {
  const result = await pool.query(
    `SELECT * FROM events WHERE status = 'published' ORDER BY starts_at, name`,
  );
  return result.rows;
}

export async function updateEvent(eventId, organizerId, input) {
  return withTransaction(async (client) => {
    const locked = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    const event = locked.rows[0];
    if (!event || event.organizer_id !== organizerId) return { error: 'not_found' };
    if (event.status === 'cancelled') return { error: 'locked' };
    const metrics = await eventMetrics(client, eventId);
    if (input.capacity < metrics.occupied) return { error: 'capacity' };
    await client.query(
      `UPDATE events
       SET name = $2, starts_at = $3, venue = $4, capacity = $5, price_cents = $6
       WHERE id = $1`,
      [eventId, input.name, input.startsAt.toISOString(), input.venue, input.capacity, input.priceCents],
    );
    return { ok: true };
  });
}

export async function publishEvent(eventId, organizerId) {
  return withTransaction(async (client) => {
    const locked = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    const event = locked.rows[0];
    if (!event || event.organizer_id !== organizerId) return { error: 'not_found' };
    if (event.status !== 'draft') return { error: 'locked' };
    if (new Date(event.starts_at).getTime() <= Date.now()) return { error: 'past_date' };
    await client.query(`UPDATE events SET status = 'published' WHERE id = $1`, [eventId]);
    return { ok: true };
  });
}
