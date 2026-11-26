import { pool } from './db.js';
import { hashPassword, newId, newSessionId, verifyPassword } from './crypto.js';
import { isEmail } from './format.js';

export async function currentUser(request) {
  const sid = request.cookies?.sid;
  if (!sid) return null;
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [sid],
  );
  return result.rows[0] ?? null;
}

export async function registerParticipant({ name, email, password }) {
  const cleanName = String(name ?? '').trim();
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (cleanName.length < 1 || cleanName.length > 120) return { error: 'invalid' };
  if (!isEmail(cleanEmail)) return { error: 'invalid' };
  if (String(password ?? '').length < 6) return { error: 'invalid' };
  try {
    const id = newId('usr_');
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'participant')`,
      [id, cleanName, cleanEmail, hashPassword(password)],
    );
    return { user: { id, name: cleanName, email: cleanEmail, role: 'participant' } };
  } catch (error) {
    if (error.code === '23505') return { error: 'email_taken' };
    throw error;
  }
}

export async function authenticate(email, password) {
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
  const user = result.rows[0];
  if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function openSession(userId) {
  const id = newSessionId();
  await pool.query('INSERT INTO sessions (id, user_id) VALUES ($1, $2)', [id, userId]);
  return id;
}

export async function closeSession(sid) {
  if (!sid) return;
  await pool.query('DELETE FROM sessions WHERE id = $1', [sid]);
}
