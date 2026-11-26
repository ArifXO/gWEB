-- gWEB database setup. Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Every piece of user data (routine, workout, custom exercise, settings) is one row.
-- Each row belongs to one user, and Row Level Security makes sure nobody can read anyone else's rows.

create table if not exists public.records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null,              -- 'routine' | 'workout' | 'exercise' | 'settings'
  id         text        not null,
  data       jsonb       not null,
  updated_at bigint      not null,              -- client edit time (ms); newest edit wins
  deleted    boolean     not null default false,
  server_ts  timestamptz not null default now(), -- when the server last accepted a change; used for pulls
  primary key (user_id, kind, id)
);

create index if not exists records_user_server_ts on public.records (user_id, server_ts);

alter table public.records enable row level security;

grant select, insert, update, delete on public.records to authenticated;

drop policy if exists "own rows" on public.records;
create policy "own rows" on public.records
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Saves a batch of rows, but never lets an older edit overwrite a newer one
-- (two phones editing the same routine keep the most recent change).
create or replace function public.push_records(items jsonb)
returns void
language sql
security invoker
as $$
  insert into public.records as r (user_id, kind, id, data, updated_at, deleted, server_ts)
  select auth.uid(), i->>'kind', i->>'id', i->'data', (i->>'updated_at')::bigint, coalesce((i->>'deleted')::boolean, false), clock_timestamp()
  from jsonb_array_elements(items) as i
  on conflict (user_id, kind, id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        server_ts = excluded.server_ts
    where r.updated_at < excluded.updated_at;
$$;

grant execute on function public.push_records(jsonb) to authenticated;
