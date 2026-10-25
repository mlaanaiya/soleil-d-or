import 'server-only'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { dataDir } from './paths'

/**
 * Migrations are append-only: never edit a released entry, add a new one.
 * The current schema version is stored in SQLite's `user_version` pragma.
 */
const MIGRATIONS: string[] = [
  /* 1 — initial schema */ `
  CREATE TABLE media (
    id            TEXT PRIMARY KEY,
    kind          TEXT NOT NULL CHECK (kind IN ('photo', 'cutout')),
    original_name TEXT NOT NULL DEFAULT '',
    alt           TEXT NOT NULL DEFAULT '',
    width         INTEGER NOT NULL,
    height        INTEGER NOT NULL,
    widths        TEXT NOT NULL,
    has_alpha     INTEGER NOT NULL DEFAULT 0,
    placeholder   TEXT NOT NULL,
    color         TEXT NOT NULL,
    in_gallery    INTEGER NOT NULL DEFAULT 0,
    gallery_sort  INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE categories (
    id             INTEGER PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    tagline        TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    cover_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
    sort           INTEGER NOT NULL DEFAULT 0,
    visible        INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE products (
    id              INTEGER PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    details         TEXT NOT NULL DEFAULT '',
    prices          TEXT NOT NULL DEFAULT '[]',
    photo_media_id  TEXT REFERENCES media(id) ON DELETE SET NULL,
    cutout_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
    available       INTEGER NOT NULL DEFAULT 1,
    visible         INTEGER NOT NULL DEFAULT 1,
    featured        INTEGER NOT NULL DEFAULT 0,
    badge           TEXT NOT NULL DEFAULT '',
    sort            INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX products_category ON products(category_id, sort);

  CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE rate_limits (
    key      TEXT PRIMARY KEY,
    count    INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );

  CREATE TABLE orders (
    id            INTEGER PRIMARY KEY,
    ref           TEXT NOT NULL UNIQUE,
    token         TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone         TEXT NOT NULL,
    pickup_at     TEXT NOT NULL,
    items         TEXT NOT NULL,
    total_cents   INTEGER NOT NULL,
    note          TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'accepted', 'ready', 'done', 'cancelled')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX orders_status ON orders(status, created_at);

  CREATE TABLE reservations (
    id          INTEGER PRIMARY KEY,
    ref         TEXT NOT NULL UNIQUE,
    token       TEXT NOT NULL,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    email       TEXT NOT NULL DEFAULT '',
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    party_size  INTEGER NOT NULL,
    note        TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX reservations_date ON reservations(date, time);
  `,
]

function open(): Database.Database {
  const dir = dataDir()
  fs.mkdirSync(dir, { recursive: true })
  const db = new Database(path.join(dir, 'soleil-d-or.sqlite'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  migrate(db)
  return db
}

function migrate(db: Database.Database) {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]!)
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}

// Reuse one connection per process (and across dev hot reloads).
const globalForDb = globalThis as unknown as { __soleilDb?: Database.Database }

export function db(): Database.Database {
  if (!globalForDb.__soleilDb) globalForDb.__soleilDb = open()
  return globalForDb.__soleilDb
}
