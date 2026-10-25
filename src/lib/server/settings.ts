import 'server-only'
import { db } from './db'
import { SETTINGS, type SettingsKey, type SettingsValue } from '../schemas'

/**
 * Settings are stored as JSON documents and always re-validated on read, so a schema
 * evolution (new field with a default) never breaks an existing database.
 */
export function getSetting<K extends SettingsKey>(key: K): SettingsValue<K> {
  const row = db().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  const schema = SETTINGS[key]
  let raw: unknown = {}
  if (row) {
    try {
      raw = JSON.parse(row.value)
    } catch {
      raw = {}
    }
  }
  const parsed = schema.safeParse(raw)
  return (parsed.success ? parsed.data : schema.parse({})) as SettingsValue<K>
}

export function setSetting<K extends SettingsKey>(key: K, value: unknown): SettingsValue<K> {
  const parsed = SETTINGS[key].parse(value) as SettingsValue<K>
  db()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .run(key, JSON.stringify(parsed))
  return parsed
}

export function getSiteData() {
  return {
    restaurant: getSetting('restaurant'),
    hours: getSetting('hours'),
    services: getSetting('services'),
    content: getSetting('content'),
  }
}
export type SiteData = ReturnType<typeof getSiteData>
