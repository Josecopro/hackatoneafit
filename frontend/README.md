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

## Comandos para replicar de forma local (tener en cuenta todas las dependencias y correr el backend al igual que la db)

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

## Convencion BEM para estilos

Se adopto convencion BEM en clases de `scss` y `css` para mantener consistencia visual y facilitar mantenimiento.

Reglas:

- Bloques por modulo o contexto visual: `app`, `entryFlow`, `sharedFields`, `adminViews`.
- Elementos con doble guion bajo: `bloque__elemento`.
- Utilidades globales con prefijos semanticos (`a11y__*`, `hero__*`, `u__*`) cuando no pertenecen a un modulo CSS.

Ejemplos actuales:

- `styles.app__shell`, `styles.app__heroTitle`
- `styles.entryFlow__popupCard`, `styles.entryFlow__submitBtn`
- `styles.sharedFields__inputControl`, `styles.sharedFields__trackingValue`
- `styles.adminViews__table`, `styles.adminViews__statusEnRevision`
- Clases globales: `a11y__skip-link`, `hero__grid-pattern`, `u__animate-fade-in`

Guia para nuevas clases:

1. Define primero el bloque del archivo/modulo.
2. Nombra cada parte interna como elemento con `__`.
3. Evita nombres genericos (`container`, `title`, `card`) sin prefijo de bloque.


`NEXT_PUBLIC_BACKEND_BASE_URL` es obligatorio para radicar solicitudes desde el navegador. La persistencia y carga de anexos ocurre exclusivamente en el backend desacoplado.

Cada radicación guarda:

- datos clave de búsqueda (tipo, asunto, estado, fechas)
- metadatos de contacto y ubicación
- `tracking_id` único
- `payload` JSONB con todos los campos validados del formulario


Flujo implementado:

- `POST /api/admin/auth/login`: delega validacion de credenciales al backend y crea cookie de sesion `httpOnly` firmada.
- `GET /api/admin/auth/logout`: elimina sesion y redirige al login administrativo.
- `src/middleware.ts`: protege todas las rutas bajo `/administracion/*` excepto `/administracion/login`.

Cuando un usuario intenta abrir una ruta protegida sin sesion activa, se redirige a login con parametro `next` para regresar al destino luego de autenticarse.
