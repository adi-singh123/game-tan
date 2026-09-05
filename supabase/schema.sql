create table if not exists public.weekend_game (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.weekend_game enable row level security;
revoke all on table public.weekend_game from anon, authenticated;
grant all on table public.weekend_game to service_role;
