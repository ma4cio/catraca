import { pool } from './db.js';
import { settleTicket } from './purchases.js';
import { clearSchedules, scheduleSettle } from './scheduler.js';

let interval = null;

async function sweepDueTickets() {
  const result = await pool.query(
    `SELECT id FROM tickets WHERE status = 'pending' AND settle_at <= now() ORDER BY settle_at LIMIT 100`,
  );
  for (const row of result.rows) {
    try {
      await settleTicket(row.id);
    } catch (error) {
      console.error('falha na varredura do gateway', row.id, error);
    }
  }
}

export function startWorker() {
  if (interval) return;
  interval = setInterval(() => {
    sweepDueTickets().catch((error) => console.error('falha na varredura do gateway', error));
  }, 500);
}

export function stopWorker() {
  if (interval) clearInterval(interval);
  interval = null;
  clearSchedules();
}

export async function resumePending() {
  const result = await pool.query(`SELECT id, settle_at FROM tickets WHERE status = 'pending'`);
  for (const row of result.rows) {
    scheduleSettle(row.id, new Date(row.settle_at).getTime() - Date.now(), settleTicket);
  }
}
