import { pool } from './db.js';
import { hashPassword } from './crypto.js';

const SEED_USERS = [
  {
    id: 'usr_org_a',
    name: 'Organizador A',
    email: 'ana.organizadora@catraca.local',
    password: 'senha-organizador-a',
    role: 'organizer',
  },
  {
    id: 'usr_org_b',
    name: 'Organizador B',
    email: 'bruno.organizador@catraca.local',
    password: 'senha-organizador-b',
    role: 'organizer',
  },
  {
    id: 'usr_part',
    name: 'Paula Participante',
    email: 'paula.participante@catraca.local',
    password: 'senha-participante',
    role: 'participant',
  },
];

export async function seed() {
  for (const user of SEED_USERS) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [user.id, user.name, user.email, hashPassword(user.password), user.role],
    );
  }
}

export const SEED_CREDENTIALS = {
  organizerA: { email: SEED_USERS[0].email, password: SEED_USERS[0].password },
  organizerB: { email: SEED_USERS[1].email, password: SEED_USERS[1].password },
  participant: { email: SEED_USERS[2].email, password: SEED_USERS[2].password },
};
