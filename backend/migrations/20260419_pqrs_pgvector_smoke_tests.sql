-- Smoke tests for 20260419_pqrs_pgvector_full.sql
-- Run AFTER creating schema/functions.
-- Safe to run multiple times; all test data is rolled back.

begin;

-- 0) Preflight: required functions exist
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

-- 1) Seed minimum test data
-- 1.1 Ensure departments exist
insert into public.departamentos (nombre, descripcion)
values
  ('General', 'Depto general de prueba'),
  ('Salud', 'Depto salud de prueba')
on conflict (nombre) do nothing;

-- 1.2 Build reusable 768-d vectors
with v as (
  select
    ('[' || array_to_string(array_fill(0.010::float4, array[768]), ',') || ']')::vector(768) as qv,
    ('[' || array_to_string(array_fill(0.012::float4, array[768]), ',') || ']')::vector(768) as qv_alt,
    ('[' || array_to_string(array_fill(0.020::float4, array[768]), ',') || ']')::vector(768) as qv_far
)
insert into public.normativas (titulo, contenido, fuente, departamento, embedding)
select
  'Prueba General',
  'Contenido normativo general para pruebas semanticas',
  'Ley 1755 de 2015',
  d.nombre,
  v.qv
from public.departamentos d
cross join v
where d.nombre = 'General';

with v as (
  select ('[' || array_to_string(array_fill(0.011::float4, array[768]), ',') || ']')::vector(768) as qv
)
insert into public.normativas (titulo, contenido, fuente, departamento, embedding)
select
  'Prueba Salud',
  'Contenido normativo salud para pruebas semanticas',
  'Resolucion Salud 2026',
  d.nombre,
  v.qv
from public.departamentos d
cross join v
where d.nombre = 'Salud';

-- 1.3 Insert a test PQRS with embedding and metadata
with v as (
  select ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768) as qv
), d as (
  select id from public.departamentos where nombre = 'Salud' limit 1
)
insert into public.pqrs (
  texto_original,
  tipo_solicitante,
  canal,
  departamento,
  estado,
  requiere_humano,
  metadata,
  embedding
)
select
  'Ciudadano reporta demoras en atencion de salud y solicita respuesta formal.',
  'ciudadano',
  'web',
  'Salud',
  'borrador',
  true,
  '{"test": true, "source": "smoke"}'::jsonb,
  v.qv
from d
cross join v;

-- 1.4 Insert a draft response (not approved yet)
insert into public.respuestas (
  pqrs_id,
  texto_borrador,
  texto_final,
  aprobada,
  requiere_revision
)
select
  p.id,
  'Borrador inicial de respuesta para prueba.',
  'Respuesta final aprobada de prueba.',
  false,
  true
from public.pqrs p
where p.metadata ->> 'source' = 'smoke'
order by p.created_at desc
limit 1;

-- 2) Trigger test: approving response should create respuestas_oro row
update public.respuestas r
set
  aprobada = true,
  aprobada_por = 'qa-smoke',
  updated_at = now()
where r.id = (
  select r2.id
  from public.respuestas r2
  join public.pqrs p on p.id = r2.pqrs_id
  where p.metadata ->> 'source' = 'smoke'
  order by r2.created_at desc
  limit 1
);

-- Expect: at least one row inserted by trigger with origen_respuesta_id populated
select
  ro.id,
  ro.caso_tipo,
  ro.respuesta,
  ro.departamento,
  ro.origen_respuesta_id,
  ro.embedding
from public.respuestas_oro ro
where ro.origen_respuesta_id in (
  select r.id
  from public.respuestas r
  join public.pqrs p on p.id = r.pqrs_id
  where p.metadata ->> 'source' = 'smoke'
)
order by ro.created_at desc;

-- 3) Function tests

-- 3.1 buscar_normativas (dept = Salud; should include Salud and General)
with q as (
  select ('[' || array_to_string(array_fill(0.011::float4, array[768]), ',') || ']')::vector(768) as qv
), d as (
  select id from public.departamentos where nombre = 'Salud' limit 1
)
select *
from public.buscar_normativas(
  (select qv from q),
  (select id from d),
  5
);

-- 3.2 buscar_respuestas_oro (dept = Salud; expects at least 1 after trigger)
with q as (
  select ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768) as qv
), d as (
  select id from public.departamentos where nombre = 'Salud' limit 1
)
select *
from public.buscar_respuestas_oro(
  (select qv from q),
  (select id from d),
  5
);

-- 3.3 buscar_pqrs_similares (expects row from smoke pqrs)
with q as (
  select ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768) as qv
)
select *
from public.buscar_pqrs_similares(
  (select qv from q),
  10
);

-- 3.4 buscar_respuestas_rapidas
-- A) scoped by dept Salud
with q as (
  select ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768) as qv
), d as (
  select id from public.departamentos where nombre = 'Salud' limit 1
)
select *
from public.buscar_respuestas_rapidas(
  (select qv from q),
  (select id from d),
  5,
  0.10
);

-- B) all departments (dept_id = null)
with q as (
  select ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768) as qv
)
select *
from public.buscar_respuestas_rapidas(
  (select qv from q),
  null,
  5,
  0.10
);

-- 4) actualizar_embedding_respuesta_oro test
with target as (
  select ro.id
  from public.respuestas_oro ro
  join public.respuestas r on r.id = ro.origen_respuesta_id
  join public.pqrs p on p.id = r.pqrs_id
  where p.metadata ->> 'source' = 'smoke'
  order by ro.created_at desc
  limit 1
), vec as (
  select ('[' || array_to_string(array_fill(0.021::float4, array[768]), ',') || ']')::vector(768) as qv
)
select public.actualizar_embedding_respuesta_oro(
  (select id from target),
  (select qv from vec)
);

-- Verify embedding was updated
with target as (
  select ro.id
  from public.respuestas_oro ro
  join public.respuestas r on r.id = ro.origen_respuesta_id
  join public.pqrs p on p.id = r.pqrs_id
  where p.metadata ->> 'source' = 'smoke'
  order by ro.created_at desc
  limit 1
)
select
  ro.id,
  (ro.embedding is not null) as embedding_persistido,
  vector_dims(ro.embedding) as embedding_dims
from public.respuestas_oro ro
where ro.id = (select id from target);

-- 5) Optional explain plans (uncomment if needed)
-- explain analyze
-- select *
-- from public.buscar_pqrs_similares(
--   ('[' || array_to_string(array_fill(0.013::float4, array[768]), ',') || ']')::vector(768),
--   10
-- );

-- Keep database clean after smoke test
rollback;
