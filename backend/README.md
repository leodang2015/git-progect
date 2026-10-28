# Gestión de usuarios

La API reutiliza el modelo `User` y está protegida con JWT: todas las rutas requieren un token de administrador en `Authorization: Bearer <token>`.

## Endpoints

- `GET /api/users?q=ada&role=user&status=active&page=1&limit=20`: busca por nombre o correo y filtra por rol/estado. Devuelve `data` y metadatos de paginación.
- `POST /api/users`: crea usuario. Requiere `name`, `email` y `password`; acepta opcionalmente `role` (`user`, `admin` o `stylist`) y `status` (`active` o `inactive`). Un peluquero (`stylist`) también requiere `specialty` y `serviceIds` como lista de ids de los servicios asignados.
- `PUT /api/users/:id`: actualiza `name`, `email`, `password`, `role`, `specialty`, `serviceIds` o `status`.
- `DELETE /api/users/:id`: elimina un usuario.

Las respuestas de usuarios contienen `id`, `name`, `email`, `role`, `specialty`, `serviceIds`, `status`, `createdAt` y `updatedAt`; nunca exponen la contraseña ni los datos de bloqueo de inicio de sesión. Las contraseñas nuevas o actualizadas se hashean con el middleware existente del modelo. La selección de profesionales en el formulario de citas utiliza los servicios asignados al peluquero.

Ejecuta `npm test` desde `backend/` para validar el esquema de usuario.

El panel administrativo lee y guarda los usuarios directamente en MongoDB; no crea cuentas de demostración automáticamente. Ejecuta `npm run seed` desde `backend/` para cargar los servicios de demostración. Las credenciales de las cuentas de prueba que ya se crearon están en [../CREDENCIALES_DEMO.md](../CREDENCIALES_DEMO.md); no las uses en producción.