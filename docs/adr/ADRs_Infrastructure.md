# Architectural Decision Records – Docker, Modellübersicht, Datenbank
**Author:** Iyad Elwy
## ADR-01: Docker Compose with dev/prod profiles

**Context:** Team members need to run infrastructure locally during development without starting every application container. A full prod stack should be a single command.

**Decision:** Use a single `docker-compose.yml` with two profiles — `dev` (Postgres, MinIO, Mosquitto only) and `prod` (all services including microservices, frontend, ngrok).

**Consequences:** Developers run `docker compose --profile dev up -d` to get infrastructure, then run their service locally. CI/demos use `--profile prod`. One file to maintain instead of two.

---

## ADR-02: Multi-stage Docker builds

**Context:** Shipping devDependencies (TypeScript compiler, ts-node, Prisma CLI) in production images wastes disk space and increases attack surface.

**Decision:** All Dockerfiles use a two-stage build — a builder stage installs all deps, compiles TypeScript and generates the Prisma client; a lean runner stage installs only production deps and copies the compiled `dist/`.

**Consequences:** Smaller production images. Build tools never reach the running container.

---

## ADR-03: One PostgreSQL instance per microservice

**Context:** A single shared database creates coupling between services — schema changes in one service can affect another, and there is no clear ownership.

**Decision:** Each microservice that needs a database gets its own PostgreSQL container (`car-models-postgres` on 5432, `postgres-webshop` on 5433) with its own named volume.

**Consequences:** Services are fully isolated at the data layer. Adding a new service means adding a new DB container. Slightly more resource usage locally.

---

## ADR-04: MinIO for object storage

**Context:** Car images need to be stored and served. Storing them in the container filesystem is ephemeral and doesn't scale. The team may also need file storage for other services (e.g. webshop product images).

**Decision:** Use MinIO (S3-compatible) as shared object storage with a persistent volume. Each service manages its own bucket. Buckets are created with a public-read policy so the browser loads images directly without routing through a proxy.

**Consequences:** Images survive container restarts. Any service can use MinIO by importing the pre-wired `minio.ts` singleton. Browser fetches images directly from `localhost:9000`.

---

## ADR-05: Prisma v7 as ORM

**Context:** The team needed a type-safe database access layer that integrates well with TypeScript and reduces boilerplate SQL.

**Decision:** Use Prisma v7 with the new `prisma-client` generator, outputting the generated client to `src/generated/prisma/`. The datasource URL is configured via `prisma.config.ts` (v7 breaking change — no `url` in `schema.prisma`).

**Consequences:** Type-safe queries, auto-generated types, and schema-as-source-of-truth. Prisma v7 introduces several breaking changes (driver adapter required, ESM-first output) that required additional migration work (see ADR-06).

---

## ADR-06: prisma db push over migrations for car_models

**Context:** `prisma migrate deploy` requires migration files committed to the repo. `prisma migrate dev` requires a live database to generate them. For a seeded read-only catalog with no user data, migration history adds overhead with no benefit.

**Decision:** Use `prisma db push --accept-data-loss` in the car_models Dockerfile CMD to sync the schema on every container start without migration files.

**Consequences:** No migration history, but schema is always in sync with `schema.prisma`. Acceptable for a service where data is fully re-seeded on startup. Not suitable for services with user-owned data (e.g. webshop uses `prisma migrate deploy`).

---

## ADR-07: ngrok as a containerized service

**Context:** The team needs to expose the frontend to the internet for demos, mobile testing, and external access without configuring router port forwarding or a cloud VM.

**Decision:** Include ngrok as a service in the `prod` profile in `docker-compose.yml`, tunnelling to `frontend:3000`. The auth token is read from `.env`.

**Consequences:** Public URL is available automatically with every prod stack startup. URL changes on each restart unless a reserved ngrok domain is configured.

---

## ADR-08: Next.js Server Components for the Car Overview page

**Context:** Car data needs to be fetched from the car_models API and rendered as HTML. The choice is between fetching client-side (CSR) or server-side (SSR/RSC).

**Decision:** Implement the page as an async Next.js React Server Component with `force-dynamic` and 60-second ISR revalidation. The fetch happens inside the Next.js container using the internal Docker hostname (`car_models:4001`).

**Consequences:** The browser receives fully rendered HTML — no loading state, no client-side fetch, no API URL exposed to the browser. Images are fetched directly from MinIO by the browser with `unoptimized` on the Next.js Image component (Next.js's image optimizer cannot reach `localhost:9000` from inside the container).