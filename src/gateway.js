function integerEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return fallback;
  return value;
}

function randomBetween(min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return low + Math.floor(Math.random() * (high - low + 1));
}

export function gatewayPlan(cardNumber) {
  if (!/^\d{16}$/.test(String(cardNumber ?? ''))) return null;
  const suffix = cardNumber.slice(-4);
  const fast = randomBetween(integerEnv('GATEWAY_FAST_MIN_MS', 2000), integerEnv('GATEWAY_FAST_MAX_MS', 4000));
  const slow = randomBetween(integerEnv('GATEWAY_SLOW_MIN_MS', 33000), integerEnv('GATEWAY_SLOW_MAX_MS', 40000));
  if (suffix === '0001') return { approved: true, delayMs: fast };
  if (suffix === '0002') return { approved: false, delayMs: fast };
  if (suffix === '0003') return { approved: true, delayMs: slow };
  if (suffix === '0004') return { approved: false, delayMs: slow };
  return { approved: false, delayMs: fast };
}
