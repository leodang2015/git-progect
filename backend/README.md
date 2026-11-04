# Gestión de usuarios y reservas

La API reutiliza el modelo `User` y está protegida con JWT. Las rutas administrativas requieren un token de administrador; la consulta de peluqueros está disponible para usuarios autenticados y el perfil/zona de trabajo solo para la cuenta peluquero autenticada.

## Endpoints

- `GET /api/users?q=ada&role=user&status=active&page=1&limit=20`: busca por nombre o correo y filtra por rol/estado. Devuelve `data` y metadatos de paginación.
- `GET /api/users/stylists?serviceName=...`: requiere sesión y busca el servicio por su nombre exacto en MongoDB. Devuelve todos los peluqueros activos asignados a ese servicio, incluidas sus zonas de trabajo (que pueden estar vacías).
- `GET /api/users/me`: requiere sesión de peluquero y devuelve su perfil.
- `PUT /api/users/me/work-areas`: requiere sesión de peluquero; recibe `{ "workAreas": ["Cabello largo", "Barba"] }` y solo modifica las zonas de la cuenta autenticada (máximo 20, 80 caracteres cada una).
- `POST /api/users`: crea usuario. Requiere `name`, `email` y `password`; acepta opcionalmente `role` (`user`, `admin` o `stylist`) y `status` (`active` o `inactive`). Un peluquero (`stylist`) también requiere `specialty` y `serviceIds` como lista de ids de los servicios asignados.
- `PUT /api/users/:id`: actualiza `name`, `email`, `password`, `role`, `specialty`, `serviceIds` o `status`.
- `DELETE /api/users/:id`: elimina un usuario.

Las respuestas de usuarios contienen `id`, `name`, `email`, `role`, `specialty`, `serviceIds`, `workAreas`, `status`, `createdAt` y `updatedAt`; nunca exponen la contraseña ni los datos de bloqueo de inicio de sesión. Las contraseñas nuevas o actualizadas se hashean con el middleware existente del modelo. Los peluqueros administran sus zonas en `peluquero.html`; para aparecer como opción reservable, la cuenta debe estar activa, tener asignado el servicio seleccionado y registrar al menos una zona. La reserva muestra primero la zona y después el estilista disponible para esa combinación.

## Reservas

- `GET /api/reservations`: requiere sesión. Devuelve las reservas propias del cliente, las citas asignadas al peluquero autenticado o todas las reservas para el administrador.
- `POST /api/reservations`: requiere sesión y recibe `serviceName`, `stylistId`, `hairLength`, `date` (`YYYY-MM-DD`), `time` y `notes`. Verifica que el servicio esté activo, el peluquero tenga asignado ese servicio y zona, y que el horario esté libre. El cliente, el precio y el estado se determinan en el servidor; la cita se guarda en MongoDB como pendiente.
- `PATCH /api/reservations/:id/cancel`: requiere sesión. Solo permite cancelar al cliente titular, al peluquero asignado o a un administrador, y únicamente si la cita está pendiente o confirmada.

Las respuestas de reserva incluyen `id` (código para mostrar), `mongoId`, `serviceId`, `serviceName`, `stylistId`, `stylistName`, datos básicos del cliente, fecha, hora, zona, precio, estado y marcas de tiempo. El catálogo del formulario sigue cargándose desde `localStorage`; el nombre del servicio debe coincidir con uno activo en MongoDB.

Ejecuta `npm test` desde `backend/` para validar los esquemas de reservas, usuarios y servicios.

El panel administrativo lee y guarda los usuarios directamente en MongoDB; no crea cuentas de demostración automáticamente. Ejecuta `npm run seed` desde `backend/` para cargar los servicios de demostración. Las credenciales de las cuentas de prueba que ya se crearon están en [../CREDENCIALES_DEMO.md](../CREDENCIALES_DEMO.md); no las uses en producción.