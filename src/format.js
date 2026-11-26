const TZ = 'America/Sao_Paulo';

function partsInSaoPaulo(date) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const map = {};
  for (const part of formatted) map[part.type] = part.value;
  if (map.hour === '24') map.hour = '00';
  return map;
}

export function formatOffsetIso(date) {
  const map = partsInSaoPaulo(date);
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}-03:00`;
}

export function formatDateTimeLocal(date) {
  return formatOffsetIso(date).slice(0, 16);
}

export function parseSaoPauloLocal(input) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(String(input ?? '').trim());
  if (!match) return null;
  const localTime = `${match[1]}T${match[2]}:${match[3] ?? '00'}`;
  const calendarDate = new Date(`${localTime}Z`);
  // Date normaliza dias inexistentes. A comparação detecta essa normalização.
  if (Number.isNaN(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 19) !== localTime) {
    return null;
  }
  return new Date(`${localTime}-03:00`);
}

export function formatBrl(cents) {
  const value = Number(cents);
  const abs = Math.abs(value);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, '0');
  const grouped = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${value < 0 ? '-' : ''}${grouped},${centavos}`;
}

export function parseReais(input) {
  const raw = String(input ?? '').trim().replace(/\s/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isInteger(cents) || cents <= 0) return null;
  return cents;
}

export function parseCapacity(input) {
  const raw = String(input ?? '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const capacity = Number(raw);
  if (!Number.isInteger(capacity) || capacity < 1) return null;
  return capacity;
}

export const STATUS_LABELS = {
  pending: 'pendente',
  confirmed: 'confirmado',
  declined: 'recusado',
  cancelled: 'cancelado',
  refunded: 'estornado',
};

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isCardNumber(value) {
  return typeof value === 'string' && /^\d{16}$/.test(value);
}
