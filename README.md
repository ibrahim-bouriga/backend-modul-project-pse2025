# PSE 2025 – Backend Modul Project

> [!Note]
> To enable the deployment via HTTPS, we are using NGROK to tunnel our local URIs to a hosted solution. You must configure the NGROK_AUTHTOKEN environment variable in your local .env

### Create .env (required)
```sh
cp .env.example .env
```
Don't forget to set the NGROK_AUTHTOKEN!

## Deploy production ready application via docker

```sh
docker compose --profile prod up --build -d
```

Builds and runs every service in containers. Use this to verify the production setup, not for day-to-day development.

## Architecture

This monorepo contains one shared frontend and multiple microservices. 

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

| Service                    | What it is              | Port(s)                      |
|----------------------------|-------------------------|------------------------------|
| PostgreSQL (car_models)    | Car catalogue database  | 5432                         |
| PostgreSQL (webshop)       | Webshop database        | 5433                         |
| Redis                      | Session / cache store   | 6379                         |
| Mosquitto                  | MQTT broker             | 1883 (TCP), 9001 (WebSocket) |
| MinIO                      | Object / file storage   | 9000 (API), 9002 (Web UI)    |

## Local development

### First-time setup

```sh
# 1. Start infrastructure (databases, MQTT, MinIO, Redis)
docker compose --profile dev up -d

# 2. Create a root .env (all values have safe defaults)
cp .env.example .env

3

# 4. Install dependencies, generate per-package .env files, and set up databases
npm run setup-dev
```

`npm run setup-dev` runs `setup-dev.sh`, which:
- Calls `generate-env.sh` to create a `.env` for every package under `packages/`
- Installs all npm dependencies
- Detects every package that has a `prisma.config.ts` and either runs
  `prisma migrate deploy` (when a `migrations/` folder exists) or `prisma db push`

Run `npm run setup-dev` again whenever you change the root `.env` or pull new migrations.

### Running services

```sh
npm run dev          # start all services in parallel
```

Or individually:

```sh
npm run dev:car_models        # Car catalogue API  — http://localhost:4001
npm run dev:webshop           # Webshop API        — http://localhost:4003
npm run dev:service-mypsecars # MyPSECars service  — http://localhost:4004
npm run dev:frontend          # Next.js frontend   — http://localhost:3000
```

### Service URLs

| Service           | URL                      |
|-------------------|--------------------------|
| Frontend          | http://localhost:3000    |
| Car Models API    | http://localhost:4001    |
| Webshop API       | http://localhost:4003    |
| MyPSECars Service | http://localhost:4004    |
| MinIO Web UI      | http://localhost:9002    |


## Documentation

| Doc | Contents |
|-----|----------|
| [docs/docker.md](docs/docker.md) | Profiles, commands, `-d` flag, logs |
| [docs/database.md](docs/database.md) | Adding models, running migrations, using Prisma |
| [docs/mqtt.md](docs/mqtt.md) | Publishing, subscribing, topic conventions |
