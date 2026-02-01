# Autenticación (Backend) — refresh tokens stateful (DB) y cookie httpOnly

Este documento resume los cambios de autenticación implementados en el backend y cómo usar los endpoints desde el frontend.

Resumen
- Ahora el backend emite dos piezas al autenticar: un access token (JWT) en el body y un refresh token opaco que se almacena hashed en la BD (`refresh_tokens`).
- El refresh token se envía al cliente como cookie httpOnly llamada `refreshToken`. El backend también conserva la opción de leer un refresh token enviado en el body para compatibilidad.
- El refresh token es rotado en cada `POST /auth/refresh`: el registro antiguo se marca `revoked` y se crea uno nuevo (replacedById). Esto permite revocación y manejo de sesiones.

Endpoints relevantes

- POST /api/auth/login
  - Request: { email?, userEmail?, employeeEmail?, password }
  - Response: {
      access_token: string,
      user: { id, type, ... }
    }
  - Side-effect: el servidor setea la cookie `refreshToken` (httpOnly, sameSite=lax, secure en production) con el refresh token opaco. El response no incluye `refresh_token` por diseño.

- POST /api/auth/refresh
  - Request: opcionalmente { refreshToken } en el body. Si no se pasa, el servidor buscará la cookie `refreshToken` en la petición.
  - Response: { access_token, refresh_token }
  - Nota: el servidor rota el refresh token y devuelve el nuevo pair. Si se usa cookie-based flow, el nuevo refresh_token se devolverá en la cookie; el body puede incluir (pero no es necesario) el nuevo refresh token.

- POST /api/auth/revoke
  - Protegido por JWT (JwtAnyGuard).
  - Request: { refreshToken?, revokeAll?: boolean }
    - Si `revokeAll: true` revoca todas las sesiones para el owner autenticado (usa `req.user.sub` y `req.user.type`).
    - Si `refreshToken` se suministra, revoca ese token específico.

- POST /api/auth/logout
  - Request: vacío. El servidor leerá el refresh token desde la cookie (`refreshToken`) o desde el body.{ refreshToken }.
  - Acción: revoca el refresh token en BD y borra la cookie (res.clearCookie('refreshToken')).

Requisitos de CORS y cookies
- Si el frontend y backend están en orígenes distintos, es necesario permitir credenciales en CORS y que el cliente envíe cookies:

  // NestJS (main.ts)
  app.enableCors({
    origin: 'https://tu-frontend.example',
    credentials: true,
  });

- En el cliente (Angular) asegúrate de usar `withCredentials: true` en las peticiones que envían o esperan cookies (login, refresh, logout). Ejemplo con HttpClient:

  this.http.post('/api/auth/refresh', {}, { withCredentials: true })

Notas de seguridad
- La cookie `refreshToken` se marca `httpOnly` para que no sea accesible desde JavaScript, reduciendo riesgo de XSS.
- `secure` se activa automáticamente en production (configurado por `NODE_ENV`).
- Considera políticas adicionales: limitar IP/agent por token, TTL corto para access token, rotación obligatoria y almacenamiento de metadatos para auditoría.

DB / migraciones
- Se agregó la entidad `RefreshToken` y la tabla `refresh_tokens`. Si usas migraciones (recomendado), ya se creó la migración `src/migrations/*CreateRefreshTokensTable.ts`.
- Si no usas `synchronize`, aplica la migración con:

  npm run migration:run

Compatibilidad con clientes antiguos
- Si clientes antiguos almacenaban el refresh token en localStorage, el backend aún acepta `{ refreshToken }` en el body para compatibilidad, pero se recomienda migrar a cookie-based refresh.

Preguntas frecuentes
- ¿Por qué devolver access token en el body en lugar de cookie? Razonamos que el access token a menudo debe usarse en Authorization header (Bearer) por APIs y middlewares en distintos dominios; la cookie se usa sólo para refresh (rotación, revocación más segura).

Si necesitas que el backend también emita el access token en cookie (para apps SPA que prefieren no manejar headers), podemos añadir esa opción, pero implica revisar SameSite/CSRF.
