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
- `supabase/pqrsd_schema.sql`: script SQL para crear tabla e índices de almacenamiento.

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
NEXT_PUBLIC_BACKEND_BASE_URL=https://hackatoneafit.onrender.com
```

`NEXT_PUBLIC_BACKEND_BASE_URL` es obligatorio para radicar solicitudes desde el navegador. La persistencia y carga de anexos ocurre exclusivamente en el backend desacoplado.

Cada radicación guarda:

- datos clave de búsqueda (tipo, asunto, estado, fechas)
- metadatos de contacto y ubicación
- `tracking_id` único
- `payload` JSONB con todos los campos validados del formulario

## Autenticacion de administradores

Configura tambien estas variables en `frontend/.env.local` (o en la raiz si ejecutas con `run-dev.sh`):

```bash
BACKEND_BASE_URL=https://hackatoneafit.onrender.com
ADMIN_AUTH_SECRET=change-this-secret-with-at-least-32-chars
```

Flujo implementado:

- `POST /api/admin/auth/login`: delega validacion de credenciales al backend y crea cookie de sesion `httpOnly` firmada.
- `GET /api/admin/auth/logout`: elimina sesion y redirige al login administrativo.
- `src/middleware.ts`: protege todas las rutas bajo `/administracion/*` excepto `/administracion/login`.

Desde la etapa 2, los administradores viven en la tabla `admin_users` de Supabase y el frontend ya no lee correo/contrasena de variables de entorno.

Cuando un usuario intenta abrir una ruta protegida sin sesion activa, se redirige a login con parametro `next` para regresar al destino luego de autenticarse.
