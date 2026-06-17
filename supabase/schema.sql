-- attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  timestamp text NOT NULL,
  status text NOT NULL DEFAULT '0',
  verify text NOT NULL DEFAULT '0',
  device_sn text NOT NULL DEFAULT 'unknown',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_punch UNIQUE (user_id, timestamp, device_sn)
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_created_at ON attendance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_device_sn ON attendance_logs(device_sn);

-- device_users table
CREATE TABLE IF NOT EXISTS device_users (
  pin text NOT NULL,
  name text,
  card text,
  role text DEFAULT '0',
  device_sn text NOT NULL,
  synced_at timestamptz DEFAULT now(),
  PRIMARY KEY (pin, device_sn)
);
