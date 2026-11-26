import { pool } from './db.js';

export async function eventMetrics(client, eventId) {
  const db = client ?? pool;
  const eventResult = await db.query(
    'SELECT id, capacity, status, price_cents FROM events WHERE id = $1',
    [eventId],
  );
  if (eventResult.rowCount === 0) return null;
  const event = eventResult.rows[0];
  const counts = await db.query(
    `SELECT
       (count(*) FILTER (WHERE status = 'confirmed'))::int AS confirmed,
       (count(*) FILTER (WHERE status = 'pending'))::int AS pending,
       (count(*) FILTER (WHERE status = 'confirmed' AND checked_in))::int AS checkins,
       (count(*) FILTER (WHERE status = 'refunded'))::int AS refunded,
       (count(*) FILTER (WHERE status = 'declined'))::int AS declined,
       (count(*) FILTER (WHERE status = 'cancelled'))::int AS cancelled,
       coalesce((sum(price_cents) FILTER (WHERE status = 'confirmed')), 0)::int AS revenue_cents
     FROM tickets
     WHERE event_id = $1`,
    [eventId],
  );
  const row = counts.rows[0];
  const occupied = row.confirmed + row.pending;
  const available = event.status === 'cancelled' ? 0 : event.capacity - occupied;
  return {
    capacity: event.capacity,
    status: event.status,
    priceCents: event.price_cents,
    confirmed: row.confirmed,
    pending: row.pending,
    checkins: row.checkins,
    refunded: row.refunded,
    declined: row.declined,
    cancelled: row.cancelled,
    occupied,
    available,
    revenueCents: row.revenue_cents,
  };
}
