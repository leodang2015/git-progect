# Gestión de usuarios

La API reutiliza el modelo `User` y está protegida con JWT: todas las rutas requieren un token de administrador en `Authorization: Bearer <token>`.

## Endpoints

- `GET /api/users?q=ada&role=user&status=active&page=1&limit=20`: busca por nombre o correo y filtra por rol/estado. Devuelve `data` y metadatos de paginación.
- `POST /api/users`: crea usuario. Requiere `name`, `email` y `password`; acepta opcionalmente `role` (`user` o `admin`) y `status` (`active` o `inactive`).
- `PUT /api/users/:id`: actualiza `name`, `email`, `password`, `role` o `status`.
- `DELETE /api/users/:id`: elimina un usuario.

Las respuestas de usuarios contienen `id`, `name`, `email`, `role`, `status`, `createdAt` y `updatedAt`; nunca exponen la contraseña ni los datos de bloqueo de inicio de sesión. Las contraseñas nuevas o actualizadas se hashean con el middleware existente del modelo.

Ejecuta `npm test` desde `backend/` para validar el esquema de usuario.

## Reservas

- `GET /api/reservations?user=<id>&status=pending&page=1&limit=20`: lista las reservas paginadas y ordenadas por fecha. Un usuario normal solo consulta sus propias reservas; un administrador puede filtrar por `user` o `status`. La respuesta incluye el nombre, correo y teléfono del usuario, y el nombre, precio, duración y categoría del servicio, sin exponer contraseñas.
- `POST /api/reservations`: crea una reserva para el usuario autenticado. Requiere `Authorization: Bearer <token>` y un cuerpo con `serviceId` y `date` (fecha y hora futura en formato ISO 8601 con zona horaria, por ejemplo `2026-10-15T14:30:00-05:00`). El servicio debe estar activo. La duración se toma del servicio y la API devuelve `409` si el intervalo se cruza con una reserva pendiente o confirmada.
- `PUT /api/reservations/:id`: permite actualizar `serviceId`, `date` o ambos en una reserva propia (o cualquiera si es administrador). Valida la nueva disponibilidad antes de actualizar y devuelve `409` si hay cruce o la reserva ya está cancelada/finalizada.

La reserva guarda el usuario, el servicio, el inicio (`date`), el final calculado (`endDate`) y el estado (`pending` por defecto). Los intervalos que solo se tocan en el límite se consideran disponibles.