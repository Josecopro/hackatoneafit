-- Idempotent migration for pqrsd_requests and admin-backed flow.
-- Safe to run multiple times.

create extension if not exists "pgcrypto";

create table if not exists public.pqrsd_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null,
  request_type text not null,
  status text not null default 'received',
  subject text,
  description text,
  incident_address text,
  email text,
  phone text,
  person_type text,
  doc_type text,
  doc_number text,
  full_name text,
  department text,
  city text,
  address text,
  attachments_count integer not null default 0,
  attachments jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pqrsd_requests
  add column if not exists tracking_id text,
  add column if not exists request_type text,
  add column if not exists status text,
  add column if not exists subject text,
  add column if not exists description text,
  add column if not exists incident_address text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists person_type text,
  add column if not exists doc_type text,
  add column if not exists doc_number text,
  add column if not exists full_name text,
  add column if not exists department text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists attachments_count integer,
  add column if not exists attachments jsonb,
  add column if not exists payload jsonb,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.pqrsd_requests
set
  status = coalesce(status, 'received'),
  attachments_count = coalesce(attachments_count, 0),
  attachments = coalesce(attachments, '[]'::jsonb),
  payload = coalesce(payload, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  status is null
  or attachments_count is null
  or attachments is null
  or payload is null
  or created_at is null
  or updated_at is null;

alter table public.pqrsd_requests
  alter column status set default 'received',
  alter column attachments_count set default 0,
  alter column attachments set default '[]'::jsonb,
  alter column payload set default '{}'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.pqrsd_requests
  alter column status set not null,
  alter column attachments_count set not null,
  alter column attachments set not null,
  alter column payload set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

create unique index if not exists pqrsd_requests_tracking_id_uq
  on public.pqrsd_requests (tracking_id)
  where tracking_id is not null;

create index if not exists pqrsd_requests_created_at_idx
  on public.pqrsd_requests (created_at desc);

create index if not exists pqrsd_requests_status_idx
  on public.pqrsd_requests (status);

create index if not exists pqrsd_requests_request_type_idx
  on public.pqrsd_requests (request_type);

create index if not exists pqrsd_requests_payload_gin_idx
  on public.pqrsd_requests using gin (payload jsonb_path_ops);

create or replace function public.set_updated_at_pqrsd_requests()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_pqrsd_requests on public.pqrsd_requests;
create trigger trg_set_updated_at_pqrsd_requests
before update on public.pqrsd_requests
for each row
execute function public.set_updated_at_pqrsd_requests();
