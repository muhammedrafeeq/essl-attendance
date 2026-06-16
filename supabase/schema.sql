-- NOTE: This schema is kept for reference only.
-- The project uses local JSON file storage (data/attendance_logs.json) instead of Supabase.
-- If you migrate to Supabase in the future, run this SQL in the Supabase SQL editor.

-- Create attendance_logs table
create table if not exists attendance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  timestamp text not null,
  status text not null default '0',
  verify text not null default '0',
  device_sn text not null,
  created_at timestamptz default now()
);

-- Index for fast queries
create index if not exists idx_attendance_logs_created_at on attendance_logs(created_at desc);
create index if not exists idx_attendance_logs_user_id on attendance_logs(user_id);
create index if not exists idx_attendance_logs_device_sn on attendance_logs(device_sn);

-- Enable Row Level Security
alter table attendance_logs enable row level security;

-- Policy: allow all for service role (backend)
create policy "Service role full access" on attendance_logs
  for all using (true);
