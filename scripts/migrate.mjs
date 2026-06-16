import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS attendance_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    timestamp text NOT NULL,
    status text NOT NULL DEFAULT '0',
    verify text NOT NULL DEFAULT '0',
    device_sn text NOT NULL,
    created_at timestamptz DEFAULT now()
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS device_users (
    pin text NOT NULL,
    name text,
    card text,
    role text DEFAULT '0',
    device_sn text NOT NULL,
    synced_at timestamptz DEFAULT now(),
    PRIMARY KEY (pin, device_sn)
  )
`

console.log('Tables created successfully.')
