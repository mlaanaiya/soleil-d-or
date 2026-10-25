import 'server-only'
import { query } from './db'
import { SETTINGS, type SettingsKey, type SettingsValue } from '../schemas'

/**
 * Settings are stored as JSON documents and always re-validated on read, so a schema
 * evolution (new field with a default) never breaks an existing database.
 */
function parseSetting<K extends SettingsKey>(key: K, raw: unknown): SettingsValue<K> {
  const schema = SETTINGS[key]
  const parsed = schema.safeParse(raw ?? {})
  return (parsed.success ? parsed.data : schema.parse({})) as SettingsValue<K>
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsValue<K>> {
  const rows = await query<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [key])
  return parseSetting(key, rows[0]?.value)
}

export async function setSetting<K extends SettingsKey>(key: K, value: unknown): Promise<SettingsValue<K>> {
  const parsed = SETTINGS[key].parse(value) as SettingsValue<K>
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2::text::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(parsed)],
  )
  return parsed
}

/** All public settings in a single round trip. */
export async function getSiteData() {
  const rows = await query<{ key: string; value: unknown }>(
    "SELECT key, value FROM settings WHERE key IN ('restaurant', 'hours', 'services', 'content')",
  )
  const raw = (key: string) => rows.find((r) => r.key === key)?.value
  return {
    restaurant: parseSetting('restaurant', raw('restaurant')),
    hours: parseSetting('hours', raw('hours')),
    services: parseSetting('services', raw('services')),
    content: parseSetting('content', raw('content')),
  }
}
export type SiteData = Awaited<ReturnType<typeof getSiteData>>
