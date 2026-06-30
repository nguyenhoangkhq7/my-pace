# My Pace Project Rules & Context

This file contains the workspace configuration, technology stack details, and coding guidelines for the **My Pace** project. Any AI agent assisting in this workspace should read and adhere to these guidelines.

---

## 1. Project Overview
**My Pace** is a Kanban board productivity application. It is structured as a monorepo containing a Next.js frontend and a Spring Boot backend, orchestrated with Docker Compose.

---

## 2. Directory Structure & Architecture

```
my-pace-app/
├── apps/
│   ├── web-app/            # Frontend (Next.js, React 19)
│   └── my-pace-service/    # Backend (Spring Boot, Java 21)
├── docker-compose.yml      # Docker orchestrator (Postgres 17, Redis 7, web, api)
└── .env                    # Local environment variables
```

### Frontend (`apps/web-app`)
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **UI Library:** shadcn/ui components (located in `components/ui`)
- **Key Folders:**
  - `app/`: Contains application routes and the core page layout/logic (`app/page.tsx` renders the Kanban board).
  - `components/layout/`: Global layout components (sidebar, header).
  - `components/kanban/`: Kanban board, column, and card components.
  - `components/ui/`: Reusable UI primitives.

### Backend (`apps/my-pace-service`)
- **Framework:** Spring Boot 4.x + Java 21
- **Build Tool:** Maven (`pom.xml`, wrapper files `mvnw`, `mvnw.cmd`)
- **Package Structure:** Base package `nhk`
  - `nhk.auth`: Security and authentication configurations, controllers, services.
  - `nhk.user`: User profile, credentials, and settings controllers, services, repositories.
  - `nhk.calendar`: Fixed events management, daily check-ins, and available time calculations.
  - `nhk.mail`: Email sending features (configured for Gmail SMTP).
  - `nhk.common`: Common utilities and shared helpers.
- **Database & JPA:** Spring Data JPA with PostgreSQL.
- **Caching:** Redis.
- **Authentication:** JWT (using `jjwt` library).
- **Other Libs:** MapStruct (DTO mapping), Lombok (boilerplate reduction), dotenv-java.

---

## 3. Coding Guidelines & Best Practices

### General
- Store configurations and sensitive credentials in individual service-level `.env` files (e.g. `apps/web-app/.env` and `apps/my-pace-service/.env`). Do NOT use a shared root `.env` file. Never hardcode secrets in code.
- Ensure cross-service compatibility (e.g., when adding a feature in frontend, ensure the backend endpoints match).

### Security & Authentication (JWT & Redis Blacklist)
- User IDs must always be represented as `UUID` on both the PostgreSQL schema and Java backend (e.g., in repositories, DTOs, mappers, and services) to prevent casting and consistency issues.
- Logout flow must be handled securely on both client and server:
  - **Client-side**: Call `POST /api/auth/logout` first, then clear the Zustand store session (`clearSession`), and redirect the user to `/login`.
  - **Backend-side**: Expose `POST /api/auth/logout` which parses the token, calculates its remaining TTL, saves it in Redis with key prefix `blacklist:token:{token}`, and clears the `refreshToken` HTTP-only cookie.
  - **Filter interceptor**: The `JwtAuthFilter` must query Redis for `blacklist:token:{token}` and block any blacklisted requests before authentication details are set in the security context.

### Fixed Events & Calendar
- **FullCalendar Integration**: FullCalendar v6 (React wrapper) is used for rendering. Avoid rendering complex recurrence rules on the client. The backend expands recurring events into flat occurrence records within range requests.
- **Exceptions Table**: Multi-occurrence modifications (editing "only this occurrence") must use a separate exceptions table (`fixed_event_exceptions`) mapping date overrides, avoiding cloning full series templates.
- **Timezone Safety**: Any server-side calculations involving `LocalTime.now()` or time boundary adjustments must be resolved relative to the user's profile timezone (e.g., `LocalTime.now(ZoneId.of(user.getTimezone()))`) to prevent container-default UTC mismatches.

### Available Time & Daily Check-in
- **Union-Interval Engine**: Recalculate available time using the union of overlapping fixed events to prevent duplicate reductions.
- **Daily Check-in**: Recalculate workday availability starting from check-in time instead of default `wakeTime`. Stored in the `daily_checkins` database table.
- **Frontend Hybrid Architecture**: State is managed globally via Zustand stores (`useAvailableTimeStore` and `useCalendarStore`) but exposed to UI components via custom hooks (`useAvailableTime` and `useCalendarEvents`). This keeps UI components presentational and modular while allowing cross-page planning features to access the cached state globally.

### Frontend (Next.js / TypeScript)
- Use standard functional components with TypeScript typings.
- Prefer Tailwind CSS v4 for styling. Ensure UI matches the existing dark/modern aesthetics.
- Keep component files clean, separating presentation logic from state when possible.
- Use `Zustand` for global state management.

### Backend (Spring Boot / Java)
- Write REST controllers adhering to RESTful API best practices (appropriate HTTP status codes, routing conventions).
- Keep domain logic inside the service layer, keeping controllers thin.
- Use MapStruct mappers for mapping between entities and DTOs.
- Use Lombok annotations (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, etc.) to keep boilerplate minimal.
- Utilize `@RequiredArgsConstructor` for constructor injection.
