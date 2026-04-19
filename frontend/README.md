# Frontend (Next.js)

Aplicación web de radicación PQRSD construida con Next.js (App Router), React, React Hook Form y Zod.

## Flujo funcional

- Pantalla de entrada: selección entre radicación normal y anónima.
- Flujo normal: formulario completo de PQRS con validaciones de datos.
- Flujo anónimo: formulario reducido con protección de identidad.
- Requisitos necesarios: pantalla de anexos con reglas y carga de hasta 5 archivos.

## Estructura principal

- `src/app/page.tsx`: punto de entrada del frontend.
- `src/components/radicacion/EntryFlowSelector.tsx`: selector inicial de flujos.
- `src/App.tsx`: formularios normal/anónimo y pasos de radicación.
- `src/schema.ts`: validaciones Zod del cliente y servidor.
- `src/app/api/pqrsd/normal/route.ts`: endpoint para radicación normal.
- `src/app/api/pqrsd/anonymous/route.ts`: endpoint para radicación anónima.
- `supabase/pqrsd_schema.sql`: script SQL para crear tabla e índices de almacenamiento.
- `src/lib/backendPqrsdClient.ts`: cliente BFF para delegar solicitudes al backend.

## Comandos

Requisito: Node.js 18.18+ (recomendado 20+).

```bash
npm install
npm run dev
```

Abrir en navegador:

```text
http://localhost:3000
```

Build de producción:

```bash
npm run build
npm run start
```

Validación de tipos:

```bash
npm run lint
```

## Nota rápida de mantenimiento

Si `npm run lint` reporta errores en `.next/types/validator.ts`, revisa que cada ruta en `src/app/**/page.tsx` exporte un `default` válido y que `src/schema.ts` sea compatible con la versión actual de Zod.

## Supabase (persistencia de PQRSD)

1. Crea la tabla ejecutando el script `supabase/pqrsd_schema.sql` en el SQL Editor de Supabase.
2. Configura variables de entorno:

```bash
BACKEND_BASE_URL=http://localhost:8000
```

`BACKEND_BASE_URL` es obligatorio para radicar solicitudes. Las rutas de Next delegan toda la lógica de persistencia y anexos al backend desacoplado.

3. La persistencia ocurre en:
   - `src/app/api/pqrsd/normal/route.ts`
   - `src/app/api/pqrsd/anonymous/route.ts`

Estas rutas actúan como BFF y delegan persistencia exclusivamente al backend.

Cada radicación guarda:

- datos clave de búsqueda (tipo, asunto, estado, fechas)
- metadatos de contacto y ubicación
- `tracking_id` único
- `payload` JSONB con todos los campos validados del formulario
