# Frontend (Next.js)

Aplicación web de radicación PQRSD construida con Next.js (App Router), React, React Hook Form y Zod.

## Flujo funcional

- Pantalla de entrada: selección entre radicación normal y anónima.
- Flujo normal: formulario completo de PQRS con validaciones de datos.
- Flujo anónimo: formulario reducido con protección de identidad.
- Requisitos necesarios: pantalla de anexos con reglas y carga de hasta 5 archivos.

## Estructura principal

- `app/page.tsx`: punto de entrada del frontend.
- `src/components/radicacion/EntryFlowSelector.tsx`: selector inicial de flujos.
- `src/App.tsx`: formularios normal/anónimo y pasos de radicación.
- `src/schema.ts`: validaciones Zod del cliente y servidor.
- `app/api/pqrsd/normal/route.ts`: endpoint para radicación normal.
- `app/api/pqrsd/anonymous/route.ts`: endpoint para radicación anónima.

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

Si `npm run lint` reporta errores en `.next/types/validator.ts`, revisa que cada ruta en `app/**/page.tsx` exporte un `default` válido y que `src/schema.ts` sea compatible con la versión actual de Zod.
