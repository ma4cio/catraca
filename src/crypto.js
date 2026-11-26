import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newId(prefix) {
  return `${prefix}${randomBytes(4).toString('hex')}`;
}

export function newCode() {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

export function newSessionId() {
  return randomBytes(32).toString('hex');
}
