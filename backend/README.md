# Gestión de usuarios

La API reutiliza el modelo `User` y está protegida con JWT. Las rutas administrativas requieren un token de administrador; la consulta de peluqueros está disponible para usuarios autenticados y el perfil/zona de trabajo solo para la cuenta peluquero autenticada.

## Endpoints

- `GET /api/users?q=ada&role=user&status=active&page=1&limit=20`: busca por nombre o correo y filtra por rol/estado. Devuelve `data` y metadatos de paginación.
- `GET /api/users/stylists?serviceName=...`: requiere sesión y devuelve solo peluqueros activos asignados al servicio, junto con sus zonas de trabajo registradas.
- `GET /api/users/me`: requiere sesión de peluquero y devuelve su perfil.
- `PUT /api/users/me/work-areas`: requiere sesión de peluquero; recibe `{ "workAreas": ["Cabello largo", "Barba"] }` y solo modifica las zonas de la cuenta autenticada (máximo 20, 80 caracteres cada una).
- `POST /api/users`: crea usuario. Requiere `name`, `email` y `password`; acepta opcionalmente `role` (`user`, `admin` o `stylist`) y `status` (`active` o `inactive`). Un peluquero (`stylist`) también requiere `specialty` y `serviceIds` como lista de ids de los servicios asignados.
- `PUT /api/users/:id`: actualiza `name`, `email`, `password`, `role`, `specialty`, `serviceIds` o `status`.
- `DELETE /api/users/:id`: elimina un usuario.

Las respuestas de usuarios contienen `id`, `name`, `email`, `role`, `specialty`, `serviceIds`, `workAreas`, `status`, `createdAt` y `updatedAt`; nunca exponen la contraseña ni los datos de bloqueo de inicio de sesión. Las contraseñas nuevas o actualizadas se hashean con el middleware existente del modelo. Los peluqueros administran sus zonas en `peluquero.html`; las reservas consultan MongoDB y combinan las zonas con los servicios asignados al peluquero.

Ejecuta `npm test` desde `backend/` para validar el esquema de usuario.

El panel administrativo lee y guarda los usuarios directamente en MongoDB; no crea cuentas de demostración automáticamente. Ejecuta `npm run seed` desde `backend/` para cargar los servicios de demostración. Las credenciales de las cuentas de prueba que ya se crearon están en [../CREDENCIALES_DEMO.md](../CREDENCIALES_DEMO.md); no las uses en producción.