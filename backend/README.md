# Gestión de usuarios

La API reutiliza el modelo `User` y está protegida con JWT: todas las rutas requieren un token de administrador en `Authorization: Bearer <token>`.

## Endpoints

- `GET /api/users?q=ada&role=user&status=active&page=1&limit=20`: busca por nombre o correo y filtra por rol/estado. Devuelve `data` y metadatos de paginación.
- `POST /api/users`: crea usuario. Requiere `name`, `email` y `password`; acepta opcionalmente `role` (`user` o `admin`) y `status` (`active` o `inactive`).
- `PUT /api/users/:id`: actualiza `name`, `email`, `password`, `role` o `status`.
- `DELETE /api/users/:id`: elimina un usuario.

Las respuestas de usuarios contienen `id`, `name`, `email`, `role`, `status`, `createdAt` y `updatedAt`; nunca exponen la contraseña ni los datos de bloqueo de inicio de sesión. Las contraseñas nuevas o actualizadas se hashean con el middleware existente del modelo.

Ejecuta `npm test` desde `backend/` para validar el esquema de usuario.