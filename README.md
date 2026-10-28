# BellaSalón

## 1. Nombre del proyecto

**BellaSalón — sistema web de reservas para peluquería.**

## 2. Descripción

Aplicación web para que los clientes consulten servicios capilares, creen una cuenta y gestionen sus citas. El personal peluquero puede indicar sus zonas de trabajo; estas se guardan en MongoDB y se usan para mostrar profesionales relacionados con el servicio y la zona elegidos. El administrador gestiona usuarios, peluqueros y servicios, y puede atender las solicitudes de cita.

> **Nota de alcance:** en la versión actual, usuarios y servicios se gestionan mediante la API con MongoDB. La agenda de reservas del frontend todavía utiliza almacenamiento local del navegador; no se debe describir como persistida en MongoDB hasta que exista esa integración.

## 3. Integrantes

| Integrante | Responsabilidad principal en Sprint 3 |
|---|---|
| Omar Leonardo Dangond Rueda | Backend |
| Javier Esneider Pinto Rodriguez | Desarrollo e integración |
| Edward Blanco | Frontend |

## 4. Tecnologías

- **Frontend:** HTML, CSS y JavaScript.
- **Backend:** Node.js y Express.
- **Base de datos y ODM:** MongoDB y Mongoose.
- **Autenticación:** JWT.
- **Validación de solicitudes:** express-validator.
- **Pruebas:** Node.js Test Runner (`node --test`).
- **Despliegue configurado:** Vercel (verificar que las URLs sigan activas antes de entregar).

## 5. Arquitectura

El frontend está en `frontend/` y consume la API REST del backend ubicado en `backend/`. Express organiza las rutas, controladores, modelos Mongoose, validadores y middleware de autenticación/autorización. MongoDB almacena usuarios y servicios. Las rutas administrativas requieren rol de administrador; el perfil de zonas de trabajo solo puede ser actualizado por el peluquero autenticado.

```text
Navegador (frontend)
        │ HTTP / JSON + JWT
        ▼
API Express (backend/src)
        │ Mongoose
        ▼
MongoDB
```

## 6. Instalación y ejecución local

### Requisitos

- Node.js y npm.
- Una instancia de MongoDB local o una URI de MongoDB Atlas.
- Una extensión/servidor estático para servir los archivos del frontend (por ejemplo, Live Server).

### Backend

Desde la raíz del repositorio:

```bash
cd backend
npm install
```

Crea `backend/.env` con las variables de la sección siguiente. Luego ejecuta:

```bash
npm start
```

El servidor usa el puerto `5000` por defecto. Para cargar los servicios de demostración:

```bash
npm run seed
```

### Frontend

Abre `frontend/` con un servidor estático y visita `index.html`. Para solicitudes API locales, verifica que el backend esté ejecutándose y que el origen del frontend esté permitido por CORS en `backend/src/server.js`.

### Pruebas

```bash
cd backend
npm test
```

## 7. Variables de entorno

Configúralas en `backend/.env`. No publiques ese archivo ni incluyas secretos en commits.

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP del backend; por defecto, `5000`. |
| `NODE_ENV` | Entorno de ejecución, por ejemplo `development` o `production`. |
| `MONGO_URI` | URI de conexión a MongoDB. |
| `JWT_SECRET` | Secreto privado usado para firmar los tokens JWT. Usa un valor aleatorio y seguro. |

Ejemplo de archivo local (reemplaza los valores; no uses credenciales reales en documentación):

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/bellasalon
JWT_SECRET=reemplazar-por-un-secreto-aleatorio-largo
```

## 8. Endpoints

Todas las rutas indicadas usan el prefijo `/api`. Las rutas protegidas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registrar un cliente. |
| `POST` | `/api/auth/login` | Público | Iniciar sesión y obtener JWT. |
| `GET` | `/api/dashboard/stats` | Usuario autenticado | Consultar estadísticas del panel. |
| `GET` | `/api/services` | Usuario autenticado | Listar y filtrar servicios activos. |
| `POST` | `/api/services` | Administrador | Crear un servicio. |
| `PUT` | `/api/services/:id` | Administrador | Actualizar un servicio. |
| `DELETE` | `/api/services/:id` | Administrador | Eliminar un servicio si no tiene reservas asociadas. |
| `GET` | `/api/users/stylists?serviceName=...` | Usuario autenticado | Listar peluqueros activos asignados al servicio y sus zonas registradas. |
| `GET` | `/api/users/me` | Peluquero autenticado | Consultar el propio perfil. |
| `PUT` | `/api/users/me/work-areas` | Peluquero autenticado | Guardar las zonas de trabajo propias. |
| `GET` | `/api/users` | Administrador | Listar, buscar y filtrar usuarios. |
| `POST` | `/api/users` | Administrador | Crear un usuario, cliente, administrador o peluquero. |
| `PUT` | `/api/users/:id` | Administrador | Actualizar un usuario. |
| `DELETE` | `/api/users/:id` | Administrador | Eliminar un usuario. |

La respuesta, validaciones y permisos detallados están documentados en [`backend/README.md`](./backend/README.md).

## 9. Historias de usuario

Historias resumidas según las funcionalidades disponibles. Completa o reemplaza esta lista con los identificadores y redacción aprobados en el tablero del equipo:

- **Cliente:** quiero registrarme e iniciar sesión para acceder a las funciones de la aplicación.
- **Cliente:** quiero consultar los servicios disponibles y solicitar una cita.
- **Cliente:** quiero elegir un peluquero que atienda el servicio y la zona que necesito.
- **Peluquero:** quiero registrar mis zonas de trabajo para que los clientes sepan qué servicios y zonas puedo atender.
- **Administrador:** quiero gestionar usuarios y asignar servicios a los peluqueros.
- **Administrador:** quiero administrar el catálogo de servicios y gestionar las solicitudes de cita.

## 10. GitHub Project

- **Repositorio:** [leodang2015/git-progect](https://github.com/leodang2015/git-progect)
- **GitHub Project:** <https://github.com/users/leodang2015/projects/1>
- **Organización del tablero:** documentar columnas, issues asignados y estado final del Sprint 3.

## 11. Sprint 3 y GitHub Actions

### Objetivo

Finalizar funcionalidades, incorporar integración continua y consolidar una versión estable del proyecto.

### Distribución del equipo

| Integrante | Área | Responsabilidades para documentar |
|---|---|---|
| Omar Leonardo Dangond Rueda | Backend | API, integración con MongoDB, autenticación/autorización y pruebas backend. |
| Javier Esneider Pinto Rodriguez | Desarrollo e integración | Organización del trabajo, flujo de ramas, integración, Issues y Pull Requests. Ajustar según las tareas realmente realizadas. |
| Edward Blanco | Frontend | Interfaz, formularios, consumo de API y validación visual. |

### Flujo de trabajo solicitado

Registra los enlaces y resultados reales a medida que se completen. No marques una actividad como terminada sin evidencia.

- [ ] Configurar un workflow de GitHub Actions para instalar dependencias y ejecutar las comprobaciones del proyecto.
- [ ] Ejecutar instalación y pruebas/validación localmente.
- [ ] Agregar y ejecutar una prueba automatizada sencilla.
- [ ] Provocar un fallo controlado en una rama de trabajo y conservar la ejecución fallida como evidencia.
- [ ] Crear un Issue para describir el fallo: `PENDIENTE: número y enlace del Issue`.
- [ ] Crear una rama `fix/<descripcion-corta>`: `PENDIENTE: nombre/enlace de rama`.
- [ ] Corregir el fallo y verificar una ejecución exitosa de Actions.
- [ ] Crear un Pull Request hacia `develop` y solicitar Code Review.
- [ ] Registrar la revisión y las correcciones solicitadas.
- [ ] Integrar el cambio a `develop`.
- [ ] Crear el Pull Request final de `develop` hacia `main`.
- [ ] Revisar y fusionar el PR final; registrar el commit o tag estable.

### Incidencia de integración reportada

Durante el trabajo se intentó integrar cambios desde otro clon/documento y GitHub Desktop mostró el mensaje **“Unable to merge unrelated histories in this repository”**. También se reportó que algunos cambios ya no se podían subir a la rama y fue necesario realizar otro `clone`. Las capturas compartidas muestran ramas como `main`, `develop` y varias ramas de funcionalidad.

Esto describe un problema de historiales/repositorios no relacionados; no necesariamente un conflicto de líneas de código. Para cerrar la evidencia del Sprint, falta registrar qué clon se conservó, qué cambios se recuperaron, qué rama recibió la integración y el enlace al commit o PR que comprueba el resultado. No se debe afirmar que el problema quedó resuelto o que hubo un merge exitoso sin esa comprobación.

### Estado verificable al preparar este README

- El backend define `npm test` con Node.js Test Runner.
- En la validación local realizada para este proyecto, `npm test` terminó con **7 pruebas aprobadas**.
- El equipo reporta que la ejecución de GitHub Actions después del fix salió excelente.
- Sin embargo, al consultar el repositorio `leodang2015/git-progect` por GitHub Actions, la API no devolvió workflows ni ejecuciones. Hace falta confirmar que el workflow esté subido al repositorio correcto y compartir el enlace/captura de la ejecución exitosa.
- Las capturas de Vercel muestran dos comprobaciones de despliegue aprobadas y deployments en estado `Ready`/`Producción` desde `main`, asociados al commit `ff301d5` (`peluquero adds`). Son evidencia de despliegue en Vercel, no sustituyen una ejecución de GitHub Actions.
- El equipo reportó Issues cerrados en el hito Sprint 3; adjuntar una captura o enlace al Project como evidencia de entrega.
- El equipo reportó una incidencia de historiales no relacionados y la necesidad de crear otro clon; adjuntar evidencia y documentar el resultado final de la recuperación.

## 12. Evidencias de entrega

Añade capturas legibles o enlaces permanentes del repositorio. Evita mostrar tokens, contraseñas, URI privadas u otros secretos.

| Evidencia solicitada | Archivo/enlace |
|---|---|
| Workflow CI (`.github/workflows/...`) | `PENDIENTE` |
| Ejecución fallida controlada de Actions | `PENDIENTE` |
| Issue del fallo | `PENDIENTE` |
| Rama `fix/*` | `PENDIENTE` |
| Prueba automatizada y resultado | `PENDIENTE` |
| Ejecución exitosa de Actions tras el fix | Reportada exitosa por el equipo; las capturas adjuntas son de Vercel, falta enlace/captura de Actions |
| Comprobaciones y deployments de Vercel | Capturas adjuntas: dos comprobaciones aprobadas y deployments `Ready` en `main`, commit `ff301d5` |
| GitHub Project: Issues Sprint 3 | Capturas adjuntas: Issues cerrados del hito Sprint 3 (12 cerrados en una vista; 28 cerrados y 1 abierto en otra) |
| PR hacia `develop` | `PENDIENTE` |
| Code Review | `PENDIENTE` |
| PR final de `develop` a `main` | `PENDIENTE` |
| Incidencia de integración / historiales no relacionados | Capturas adjuntas del error y ramas; falta documentar el resultado final de la recuperación |
| Historial de ramas y commits | `PENDIENTE` |
| Versión estable en `main` (commit o tag) | `PENDIENTE` |
| Capturas de la aplicación funcional | Captura de inicio de sesión adjunta; falta evidencia de un flujo funcional completo |

## Enlaces de despliegue

Enlaces del proyecto compartidos por el equipo:

- Repositorio GitHub: <https://github.com/leodang2015/git-progect>
- Frontend desplegado en Vercel: <https://git-progect-frontend-dd92trfx5-muebles.vercel.app/>
- Backend configurado: <https://git-progect.vercel.app>
