-- Schema for storing PQRSD requests in Supabase/Postgres
-- Run this script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.pqrsd_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null unique,
  request_type text not null check (request_type in ('normal', 'anonymous')),
  status text not null default 'received' check (status in ('received', 'in_review', 'closed')),
  subject text not null,
  description text not null,
  incident_address text not null,
  email text,
  phone text,
  person_type text,
  doc_type text,
  doc_number text,
  full_name text,
  department text,
  city text,
  address text,
  attachments_count smallint not null default 0 check (attachments_count between 0 and 5),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pqrsd_requests_created_at_idx
  on public.pqrsd_requests (created_at desc);

create index if not exists pqrsd_requests_type_created_idx
  on public.pqrsd_requests (request_type, created_at desc);

create index if not exists pqrsd_requests_status_created_idx
  on public.pqrsd_requests (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pqrsd_requests_set_updated_at on public.pqrsd_requests;

create trigger pqrsd_requests_set_updated_at
before update on public.pqrsd_requests
for each row
execute function public.set_updated_at();

alter table public.pqrsd_requests enable row level security;

-- Service role key (used by API routes) can bypass RLS.
-- Keep public access disabled by default.
