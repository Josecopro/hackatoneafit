# Hackatoneafit

## Levantar todo en desarrollo

Desde la raiz del repositorio:

```bash
chmod +x run-dev.sh
./run-dev.sh
```

El script inicia:

- Backend FastAPI en `http://localhost:8000`
- Frontend Next.js en `http://localhost:3000`

Variables utiles:

- `BACKEND_PORT` para cambiar puerto del backend
- `FRONTEND_PORT` para cambiar puerto del frontend
- `SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
