-- Maintenance Request Tool — initial schema.
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Security model: RLS is enabled on every table with NO policies, so the anon
-- and authenticated keys can read/write nothing. All access goes through Nuxt
-- server routes using the service role key, which bypasses RLS.
--
-- request.status / request.category / request.source are plain text on purpose:
-- allowed values live in config/maintenance.ts so they can change without a migration.

create table properties (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table units (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  label       text not null,
  status      text not null default 'occupied' check (status in ('occupied', 'vacant')),
  unique (property_id, label)
);

create table tenants (
  id              uuid primary key default gen_random_uuid(),
  unit_id         uuid not null references units(id) on delete cascade,
  name            text not null,
  email           text check (email = lower(email)),
  phone_digits    text,
  lease_end       date,
  import_warnings text[] not null default '{}',
  -- Natural key so the CSV import can upsert (idempotent).
  unique nulls not distinct (unit_id, name, email)
);

create table vendors (
  id     uuid primary key default gen_random_uuid(),
  name   text not null unique,
  active boolean not null default true
);

create table staff (
  id    uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name  text not null
);

create table requests (
  id                  uuid primary key default gen_random_uuid(),
  ref_code            text not null unique,
  unit_id             uuid not null references units(id),
  tenant_id           uuid references tenants(id) on delete set null,
  contact_name        text not null,
  contact_email       text,
  contact_phone       text,
  contact_verified    boolean not null default false,
  category            text not null,
  details             jsonb not null default '{}',
  description         text not null,
  permission_to_enter boolean not null default false,
  pets                text,
  best_times          text,
  source              text not null default 'form',
  status              text not null default 'new',
  vendor_id           uuid references vendors(id),
  created_by_staff_id uuid references staff(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index requests_created_at_idx on requests (created_at desc);
create index requests_unit_id_idx on requests (unit_id);

create table request_photos (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references requests(id) on delete cascade,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create index request_photos_request_id_idx on request_photos (request_id);

create table request_events (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  actor      text not null, -- 'tenant' or the staff member's email
  type       text not null check (type in ('created', 'status_changed', 'assigned', 'note_added')),
  from_value text,
  to_value   text,
  note       text,
  created_at timestamptz not null default now()
);

create index request_events_request_id_idx on request_events (request_id, created_at);

-- Keep requests.updated_at current.
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger requests_set_updated_at
  before update on requests
  for each row execute function set_updated_at();

-- RLS on, no policies: nothing is reachable with the anon/authenticated keys.
alter table properties     enable row level security;
alter table units          enable row level security;
alter table tenants        enable row level security;
alter table vendors        enable row level security;
alter table staff          enable row level security;
alter table requests       enable row level security;
alter table request_photos enable row level security;
alter table request_events enable row level security;

-- Only the service role (our server routes) may touch the tables at all.
-- Explicit so it holds whether or not "Automatically expose new tables" is on.
revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- Private photo bucket (no storage policies either → only the service role can use it).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Seed vendors.
insert into vendors (name) values
  ('In-house maintenance'),
  ('Pest control'),
  ('AC contractor'),
  ('Plumber'),
  ('Electrician')
on conflict (name) do nothing;
