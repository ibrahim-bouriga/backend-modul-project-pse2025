# PSE 2025 – Backend Modul Project

This monorepo contains one shared frontend and multiple microservices. The `packages/backend` folder is a **template** — copy it to create your own microservice.

## Architecture

```
packages/
├── frontend/          # Single shared frontend (served to the browser)
├── backend/           # Template microservice — copy this to get started
├── service-a/         # Example: your team's microservice
└── service-b/         # Example: another team's microservice
```

Each microservice is an independent Express server with its own port, database connection, and MQTT client. They all share the same Docker Compose setup.

## Creating a new microservice

1. Copy `packages/backend` to `packages/<your-service-name>`
2. Update `name` in `packages/<your-service-name>/package.json`
3. Add a new service entry in `docker-compose.yml` (use the `backend` service as reference)
4. Pick a free port and set it in `.env`

## Project structure

```
.
├── packages/
│   ├── frontend/                  # Browser frontend (http-server, port 3000)
│   │   ├── public/                # Static files served to the browser
│   │   │   ├── index.html
│   │   │   ├── styles.css
│   │   │   └── app.js
│   │   ├── src/                   # TypeScript source
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/                   # Template microservice (Express, port 4000)
│       ├── prisma/
│       │   ├── schema.prisma      # Database model definitions
│       │   └── migrations/        # Auto-generated migration files
│       ├── src/
│       │   ├── index.ts           # Express server entry point — add routes here
│       │   ├── db.ts              # Prisma client singleton — import this to query the DB
│       │   ├── mqtt.ts            # MQTT broker config — import this to publish/subscribe
│       │   └── minio.ts           # MinIO client singleton — import this to upload/download files
│       ├── prisma.config.ts       # Prisma 7 datasource config (reads DATABASE_URL from env)
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
├── mosquitto/
│   └── mosquitto.conf             # Mosquitto broker config
├── docs/
│   ├── database.md                # How to define models and run migrations (Prisma)
│   ├── docker.md                  # Docker profiles, commands, and how to run the stack
│   └── mqtt.md                    # MQTT setup, how to publish/subscribe, topic conventions
├── docker-compose.yml             # Defines all services (use --profile dev or --profile prod)
└── .env.example                   # Copy to .env and fill in your values
```

## Infrastructure

| Service    | What it is              | Port(s)            |
|------------|-------------------------|--------------------|
| PostgreSQL | Relational database     | 5432               |
| Mosquitto  | MQTT broker             | 1883 (TCP), 9001 (WebSocket) |
| MinIO      | Object / file storage   | 9000 (API), 9002 (Web UI)   |

## Development workflow

### Recommended: run everything locally

The easiest way to develop is to start infra in Docker and run application code directly on your machine — no container rebuilds on every change.

```sh
cp .env.example .env                       # first time only
docker compose --profile dev up -d         # start Postgres, MQTT, MinIO
npm run dev                                # start backend + frontend in parallel
```

`npm run dev` at the repo root runs both `packages/backend` and `packages/frontend` concurrently:

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:4000  |

To run only one at a time:

```sh
npm run dev:backend    # backend only  (port 4000)
npm run dev:frontend   # frontend only (port 3000)
```

### Override the backend URL (optional)

Create `packages/frontend/.env.local` to point at a different backend:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Defaults to `http://localhost:4000` when not set.


### Production: full Docker stack

```sh
docker compose --profile prod up --build -d
```

This builds and runs every service (frontend, backend, infra) in containers. Use this to verify the production setup, not for day-to-day development.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/docker.md](docs/docker.md) | Profiles, commands, `-d` flag, logs |
| [docs/database.md](docs/database.md) | Adding models, running migrations, using Prisma |
| [docs/mqtt.md](docs/mqtt.md) | Publishing, subscribing, topic conventions |
