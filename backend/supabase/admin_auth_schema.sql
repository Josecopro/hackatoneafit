-- Tabla de administradores para autenticacion del panel interno
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint admin_users_email_lowercase check (email = lower(email))
);

create unique index if not exists admin_users_email_unique_idx
  on public.admin_users (email);

create or replace function public.set_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_admin_users_updated_at();

comment on table public.admin_users is 'Usuarios administradores del panel PQRSD';
comment on column public.admin_users.password_hash is 'Hash bcrypt del password';

-- Ejemplo de insercion (genera primero el hash bcrypt en Python):
-- insert into public.admin_users (email, full_name, password_hash)
-- values ('admin@medellin.gov.co', 'Administrador PQRSD', '$2b$12$...');
