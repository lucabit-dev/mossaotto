create extension if not exists "uuid-ossp";

create table if not exists tracks (
  id               uuid primary key default uuid_generate_v4(),
  url              text not null,
  source           text not null check (source in ('youtube','spotify','soundcloud','bandcamp','other')),
  title            text,
  artist           text,
  artwork_url      text,
  duration_seconds integer,
  bpm              numeric(5,1),
  musical_key      text,
  genre            text,
  intensity        smallint check (intensity between 1 and 5),
  set_position     text[] not null default '{}',
  score            smallint check (score between 1 and 5),
  notes            text,
  downloaded       boolean not null default false,
  added_by         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists tracks_url_unique on tracks (url);
create index if not exists tracks_created_at_idx on tracks (created_at desc);
create index if not exists tracks_downloaded_idx on tracks (downloaded);
create index if not exists tracks_genre_idx on tracks (genre);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists tracks_set_updated_at on tracks;
create trigger tracks_set_updated_at before update on tracks
  for each row execute function set_updated_at();

alter table tracks enable row level security;

drop policy if exists "auth read"   on tracks;
drop policy if exists "auth insert" on tracks;
drop policy if exists "auth update" on tracks;
drop policy if exists "auth delete" on tracks;
create policy "auth read"   on tracks for select to authenticated using (true);
create policy "auth insert" on tracks for insert to authenticated with check (true);
create policy "auth update" on tracks for update to authenticated using (true) with check (true);
create policy "auth delete" on tracks for delete to authenticated using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tracks'
  ) then
    execute 'alter publication supabase_realtime add table tracks';
  end if;
end$$;
