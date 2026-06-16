import sql from './db'

export interface DeviceUser {
  pin: string
  name: string
  card: string
  role: string
  device_sn: string
  synced_at: string
}

export async function upsertUsers(incoming: Omit<DeviceUser, 'synced_at'>[]): Promise<void> {
  for (const u of incoming) {
    await sql`
      INSERT INTO device_users (pin, name, card, role, device_sn)
      VALUES (${u.pin}, ${u.name}, ${u.card}, ${u.role}, ${u.device_sn})
      ON CONFLICT (pin, device_sn) DO UPDATE
      SET name = EXCLUDED.name, card = EXCLUDED.card, role = EXCLUDED.role, synced_at = now()
    `
  }
}

export async function getUsers(): Promise<DeviceUser[]> {
  const rows = await sql`
    SELECT pin, name, card, role, device_sn, synced_at
    FROM device_users
    ORDER BY synced_at DESC
  `
  return rows as DeviceUser[]
}
