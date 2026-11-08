create table if not exists public.circuits (
  user_id text primary key,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_components (
  user_id text not null,
  component_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, component_id)
);

alter table public.circuits enable row level security;
alter table public.custom_components enable row level security;

revoke all on public.circuits from anon, authenticated;
revoke all on public.custom_components from anon, authenticated;
grant select, insert, update, delete on public.circuits to authenticated;
grant select, insert, update, delete on public.custom_components to authenticated;

drop policy if exists "Users can access their own circuit" on public.circuits;
create policy "Users can access their own circuit"
  on public.circuits
  for all
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "Users can access their own custom components" on public.custom_components;
create policy "Users can access their own custom components"
  on public.custom_components
  for all
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));
