-- BLOQUE 1 — EXTENSIONES
create extension if not exists vector;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- BLOQUE 2 — TABLAS RELACIONALES

-- Tabla: departamentos (catalogo auxiliar para mapear ids <-> nombres)
create table if not exists public.departamentos (
  id serial primary key,
  nombre text not null unique,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.departamentos (nombre, descripcion)
values
  ('General', 'Competencia transversal y atencion general.'),
  ('Salud', 'Secretaria o dependencia de salud.'),
  ('Educacion', 'Secretaria o dependencia de educacion.'),
  ('Hacienda', 'Secretaria o dependencia de hacienda.'),
  ('Infraestructura', 'Secretaria o dependencia de infraestructura.'),
  ('Transito', 'Secretaria o dependencia de transito.')
on conflict (nombre) do nothing;

-- Tabla: normativas (alineada al modelo actual: departamento text)
create table if not exists public.normativas (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  contenido text not null,
  departamento text not null,
  fuente text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.normativas
  add column if not exists fuente text,
  add column if not exists activo boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- Tabla: pqrs (alineada al modelo actual: id + texto_original; se agregan metadatos operativos)
create table if not exists public.pqrs (
  id uuid primary key default uuid_generate_v4(),
  texto_original text not null,
  tipo_solicitante text not null default 'ciudadano',
  canal text not null default 'web',
  departamento text not null default 'General',
  estado text not null default 'recibida',
  requiere_humano boolean not null default false,
  razon_revision text,
  ciclos_correccion integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pqrs_estado_chk check (estado in ('recibida', 'procesando', 'borrador', 'revision_humana', 'finalizada'))
);

alter table public.pqrs
  add column if not exists tipo_solicitante text,
  add column if not exists canal text,
  add column if not exists departamento text,
  add column if not exists estado text,
  add column if not exists requiere_humano boolean,
  add column if not exists razon_revision text,
  add column if not exists ciclos_correccion integer,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.pqrs
set
  tipo_solicitante = coalesce(tipo_solicitante, 'ciudadano'),
  canal = coalesce(canal, 'web'),
  departamento = coalesce(departamento, 'General'),
  estado = coalesce(estado, 'recibida'),
  requiere_humano = coalesce(requiere_humano, false),
  ciclos_correccion = coalesce(ciclos_correccion, 0),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  tipo_solicitante is null
  or canal is null
  or departamento is null
  or estado is null
  or requiere_humano is null
  or ciclos_correccion is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.pqrs
  alter column tipo_solicitante set default 'ciudadano',
  alter column canal set default 'web',
  alter column departamento set default 'General',
  alter column estado set default 'recibida',
  alter column requiere_humano set default false,
  alter column ciclos_correccion set default 0,
  alter column metadata set default '{}'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.pqrs
  alter column tipo_solicitante set not null,
  alter column canal set not null,
  alter column departamento set not null,
  alter column estado set not null,
  alter column requiere_humano set not null,
  alter column ciclos_correccion set not null,
  alter column metadata set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

-- Tabla: respuestas (si no existe en tu proyecto actual, se crea para soportar trigger y flujo)
create table if not exists public.respuestas (
  id uuid primary key default uuid_generate_v4(),
  pqrs_id uuid not null references public.pqrs(id) on delete cascade,
  texto_borrador text,
  texto_final text,
  aprobada boolean not null default false,
  aprobada_por text,
  normativas_usadas uuid[] not null default '{}',
  placeholders_detectados text[] not null default '{}',
  requiere_revision boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla: respuestas_oro (alineada al modelo actual: respuesta + departamento text)
create table if not exists public.respuestas_oro (
  id uuid primary key default uuid_generate_v4(),
  caso_tipo text not null,
  respuesta text not null,
  departamento text not null,
  origen_respuesta_id uuid references public.respuestas(id),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.respuestas_oro
  add column if not exists origen_respuesta_id uuid references public.respuestas(id),
  add column if not exists activo boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- BLOQUE 3 — COLUMNAS VECTORIALES
alter table public.normativas
  add column if not exists embedding vector(768);

alter table public.respuestas_oro
  add column if not exists embedding vector(768);

alter table public.pqrs
  add column if not exists embedding vector(768);

-- BLOQUE 4 — INDICES

-- Indices relacionales
create index if not exists pqrs_estado_idx
  on public.pqrs (estado);

create index if not exists pqrs_departamento_idx
  on public.pqrs (departamento);

create index if not exists pqrs_created_at_desc_idx
  on public.pqrs (created_at desc);

create index if not exists respuestas_pqrs_id_idx
  on public.respuestas (pqrs_id);

create index if not exists respuestas_aprobada_idx
  on public.respuestas (aprobada);

create index if not exists respuestas_oro_departamento_idx
  on public.respuestas_oro (departamento);

create index if not exists respuestas_oro_activo_idx
  on public.respuestas_oro (activo);

-- Indices vectoriales HNSW
create index if not exists normativas_embedding_hnsw_cosine_idx
  on public.normativas
  using hnsw (embedding vector_cosine_ops);

create index if not exists respuestas_oro_embedding_hnsw_cosine_idx
  on public.respuestas_oro
  using hnsw (embedding vector_cosine_ops);

create index if not exists pqrs_embedding_hnsw_cosine_idx
  on public.pqrs
  using hnsw (embedding vector_cosine_ops);

-- BLOQUE 5 — TRIGGER
create or replace function public.trg_insert_respuesta_oro_desde_aprobada()
returns trigger
language plpgsql
as $$
begin
  if old.aprobada is false and new.aprobada is true then
    insert into public.respuestas_oro (
      caso_tipo,
      respuesta,
      departamento,
      origen_respuesta_id
    )
    select
      left(coalesce(p.texto_original, ''), 100),
      coalesce(new.texto_final, ''),
      coalesce(p.departamento, 'General'),
      new.id
    from public.pqrs p
    where p.id = new.pqrs_id;

    if not found then
      insert into public.respuestas_oro (
        caso_tipo,
        respuesta,
        departamento,
        origen_respuesta_id
      )
      values (
        '',
        coalesce(new.texto_final, ''),
        'General',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists respuestas_after_update_aprobada on public.respuestas;
create trigger respuestas_after_update_aprobada
after update on public.respuestas
for each row
when (old.aprobada is false and new.aprobada is true)
execute function public.trg_insert_respuesta_oro_desde_aprobada();

-- BLOQUE 6 — FUNCIONES DE BUSQUEDA SEMANTICA

-- Funcion 1: buscar_normativas
create or replace function public.buscar_normativas(
  query_embedding vector(768),
  dept_id int,
  match_count int default 5
)
returns table(
  id uuid,
  titulo text,
  contenido text,
  fuente text,
  similitud float
)
language sql
stable
as $$
  with target_dept as (
    select d.nombre as nombre
    from public.departamentos d
    where d.id = dept_id
    limit 1
  )
  select
    n.id,
    n.titulo,
    n.contenido,
    coalesce(n.fuente, '') as fuente,
    (1 - (n.embedding <=> query_embedding))::float as similitud
  from public.normativas n
  where n.activo = true
    and n.embedding is not null
    and (
      n.departamento = 'General'
      or n.departamento = (select nombre from target_dept)
    )
  order by n.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- Funcion 2: buscar_respuestas_oro
create or replace function public.buscar_respuestas_oro(
  query_embedding vector(768),
  dept_id int,
  match_count int default 5
)
returns table(
  id uuid,
  caso_tipo text,
  respuesta_validada text,
  similitud float
)
language sql
stable
as $$
  with target_dept as (
    select d.nombre as nombre
    from public.departamentos d
    where d.id = dept_id
    limit 1
  )
  select
    r.id,
    r.caso_tipo,
    r.respuesta as respuesta_validada,
    (1 - (r.embedding <=> query_embedding))::float as similitud
  from public.respuestas_oro r
  where r.activo = true
    and r.embedding is not null
    and r.departamento = (select nombre from target_dept)
  order by r.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- Funcion 3: buscar_pqrs_similares
create or replace function public.buscar_pqrs_similares(
  query_embedding vector(768),
  match_count int default 10
)
returns table(
  id uuid,
  texto_original text,
  departamento_id int,
  estado text,
  similitud float,
  created_at timestamptz
)
language sql
stable
as $$
  select
    p.id,
    p.texto_original,
    d.id as departamento_id,
    p.estado,
    (1 - (p.embedding <=> query_embedding))::float as similitud,
    p.created_at
  from public.pqrs p
  left join public.departamentos d
    on d.nombre = p.departamento
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- Funcion 4: buscar_respuestas_rapidas
create or replace function public.buscar_respuestas_rapidas(
  query_embedding vector(768),
  dept_id int default null,
  match_count int default 5,
  similarity_threshold float default 0.70
)
returns table(
  id uuid,
  caso_tipo text,
  respuesta_validada text,
  similitud float,
  departamento_nombre text
)
language sql
stable
as $$
  with ranked as (
    select
      r.id,
      r.caso_tipo,
      r.respuesta as respuesta_validada,
      (1 - (r.embedding <=> query_embedding))::float as similitud,
      r.departamento as departamento_nombre
    from public.respuestas_oro r
    where r.activo = true
      and r.embedding is not null
      and (
        dept_id is null
        or r.departamento = (
          select d.nombre
          from public.departamentos d
          where d.id = dept_id
          limit 1
        )
      )
  )
  select
    ranked.id,
    ranked.caso_tipo,
    ranked.respuesta_validada,
    ranked.similitud,
    ranked.departamento_nombre
  from ranked
  where ranked.similitud >= similarity_threshold
  order by ranked.similitud desc
  limit greatest(match_count, 1);
$$;

-- BLOQUE 7 — FUNCION DE ACTUALIZACION DE EMBEDDING
create or replace function public.actualizar_embedding_respuesta_oro(
  respuesta_oro_id uuid,
  nuevo_embedding vector(768)
)
returns void
language sql
as $$
  update public.respuestas_oro
  set embedding = nuevo_embedding
  where id = respuesta_oro_id;
$$;

-- BLOQUE FINAL — VERIFICACION
select count(*) as total_departamentos
from public.departamentos;

select proname
from pg_proc
where proname in (
  'buscar_normativas',
  'buscar_respuestas_oro',
  'buscar_pqrs_similares',
  'buscar_respuestas_rapidas',
  'actualizar_embedding_respuesta_oro'
)
order by proname;
