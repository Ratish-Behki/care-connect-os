# Backend Structure

This backend is organized in a simple layered way so each concern has a clear location.

## Key Folders

- `src/config`: environment, CORS, and shared config modules.
- `src/database`: Prisma client entrypoint.
- `src/controllers`: HTTP controller layer for auth, user, doctors, appointments, notifications, records, profile, emergency, triage, and health.
- `src/routes`: thin API routers (`*.routes.js`) and a single `routes/index.js` route map.
- `src/middleware`: auth and centralized error handling.
- `src/services`: business logic and Prisma interaction layer.
- `src/realtime`: socket server setup and emergency realtime module.

## Entry Points

- `src/app.js`: express app creation and middleware/route wiring.
- `src/server.js`: env loading, HTTP server + Socket.IO startup.

## Notes

- Existing API behavior and endpoints are preserved.
- `data/` and empty `models/` were removed to reduce ambiguity.
- Duplicate wrapper files were removed.
- Every API module now follows: route -> controller -> service -> Prisma client.
- Emergency domain is split into focused service modules under `src/services/emergency/`:
	- `emergency.service.js` (main orchestration)
	- `emergency.dispatch.js` (dispatch creation)
	- `emergency.status.js` (status/session updates)
	- `emergency.resources.js` (ambulance/doctor/hospital fetch and assignment)
	- `emergency.geo.js` (distance/maps helpers)
	- `emergency.constants.js` (fallback emergency datasets)
	- `emergency.utils.js` (severity/specialty and normalization helpers)

## Example Flow

`POST /api/auth/register`

1. `src/routes/auth.routes.js`
2. `src/controllers/auth.controller.js`
3. `src/services/auth.service.js`
4. `src/database/prismaClient.js`
5. PostgreSQL
