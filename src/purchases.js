import { pool } from './db.js';
import { gatewayPlan } from './gateway.js';
import { newCode, newId } from './crypto.js';
import { eventMetrics } from './metrics.js';
import { scheduleSettle } from './scheduler.js';

async function insertPending(client, { event, buyerEmail, buyerUserId, channel, plan, cardNumber }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketId = newId('tkt_');
    const code = newCode();
    try {
      await client.query(
        `INSERT INTO tickets (
           id, event_id, code, status, price_cents, buyer_email, buyer_user_id, channel,
           card_last4, gateway_approved, settle_at
         ) VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10)`,
        [
          ticketId,
          event.id,
          code,
          event.price_cents,
          buyerEmail,
          buyerUserId,
          channel,
          cardNumber.slice(-4),
          plan.approved,
          new Date(Date.now() + plan.delayMs).toISOString(),
        ],
      );
      return { ticketId, code, status: 'pending', delayMs: plan.delayMs };
    } catch (error) {
      if (error.code !== '23505') throw error;
    }
  }
  throw new Error('não foi possível gerar um código de ingresso');
}

export async function purchaseTicket({ eventId, buyerEmail, buyerUserId = null, channel, cardNumber }) {
  const plan = gatewayPlan(cardNumber);
  if (!plan) return { error: 'invalid_request' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // R07: the event row is the mutex. Concurrent purchases for the same event queue here,
    // then recount pending+confirmed tickets before inserting.
    const locked = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    const event = locked.rows[0];
    if (!event || event.status !== 'published') {
      await client.query('ROLLBACK');
      return { error: 'event_not_available' };
    }
    const metrics = await eventMetrics(client, eventId);
    if (metrics.occupied >= event.capacity || metrics.available <= 0) {
      await client.query('ROLLBACK');
      return { error: 'sold_out' };
    }
    const ticket = await insertPending(client, {
      event,
      buyerEmail,
      buyerUserId,
      channel,
      plan,
      cardNumber,
    });
    await client.query('COMMIT');
    scheduleSettle(ticket.ticketId, ticket.delayMs, settleTicket);
    return { ticketId: ticket.ticketId, code: ticket.code, status: 'pending' };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function settleTicket(ticketId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const peek = await client.query('SELECT event_id, status FROM tickets WHERE id = $1', [ticketId]);
    if (peek.rowCount === 0 || peek.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return;
    }
    const eventResult = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [peek.rows[0].event_id]);
    const ticketResult = await client.query('SELECT * FROM tickets WHERE id = $1 FOR UPDATE', [ticketId]);
    const ticket = ticketResult.rows[0];
    if (!ticket || ticket.status !== 'pending') {
      await client.query('ROLLBACK');
      return;
    }
    const event = eventResult.rows[0];
    if (!event || event.status === 'cancelled') {
      await client.query(
        `UPDATE tickets SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`,
        [ticketId],
      );
      await client.query('COMMIT');
      return;
    }
    const next = ticket.gateway_approved ? 'confirmed' : 'declined';
    await client.query(
      `UPDATE tickets SET status = $2 WHERE id = $1 AND status = 'pending'`,
      [ticketId, next],
    );
    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getTicket(ticketId) {
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
  return result.rows[0] ?? null;
}

export function ticketDto(ticket) {
  return {
    ticketId: ticket.id,
    code: ticket.code,
    eventId: ticket.event_id,
    status: ticket.status,
    checkedIn: ticket.checked_in,
  };
}

export async function listTicketsForUser(userId) {
  const result = await pool.query(
    `SELECT t.*, e.name AS event_name, e.starts_at
     FROM tickets t
     JOIN events e ON e.id = t.event_id
     WHERE t.buyer_user_id = $1
     ORDER BY t.created_at DESC`,
    [userId],
  );
  return result.rows;
}
