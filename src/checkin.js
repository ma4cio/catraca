import { withTransaction } from './db.js';

export async function checkIn(eventId, submittedCode) {
  const code = String(submittedCode ?? '').trim().toUpperCase();
  if (!code) return 'Ingresso inválido para este evento';

  return withTransaction(async (client) => {
    // Compras, liquidação e cancelamento também travam primeiro o evento.
    const event = await client.query(
      'SELECT status FROM events WHERE id = $1 FOR UPDATE',
      [eventId],
    );
    if (!event.rows[0]) return 'Ingresso inválido para este evento';

    const result = await client.query(
      'SELECT id, status, checked_in FROM tickets WHERE event_id = $1 AND code = $2 FOR UPDATE',
      [eventId, code],
    );
    const ticket = result.rows[0];
    if (!ticket) return 'Ingresso inválido para este evento';
    if (event.rows[0].status === 'cancelled') return 'Evento cancelado';
    if (ticket.status !== 'confirmed') return 'Ingresso não confirmado';
    if (ticket.checked_in) return 'Ingresso já utilizado';

    await client.query('UPDATE tickets SET checked_in = true WHERE id = $1', [ticket.id]);
    return 'Entrada liberada';
  });
}
