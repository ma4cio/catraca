CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('participant', 'organizer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL REFERENCES users (id),
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 1),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_organizer_idx ON events (organizer_id);
CREATE INDEX IF NOT EXISTS events_status_idx ON events (status);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events (id),
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'refunded')),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  buyer_email TEXT NOT NULL,
  buyer_user_id TEXT REFERENCES users (id),
  channel TEXT NOT NULL CHECK (channel IN ('storefront', 'partner')),
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  card_last4 TEXT NOT NULL,
  gateway_approved BOOLEAN NOT NULL,
  settle_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_event_status_idx ON tickets (event_id, status);
