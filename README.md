# PSE 2025 – Backend Modul Project

## ZIP File
A full, ready to deploy version of the application (including the env file) is available at [Backend-Entwicklung-SoSe26-Prototyp.zip](Backend-Entwicklung-SoSe26-Prototyp.zip)

## Downloading via git clone

> [!Note]
> To enable the deployment via HTTPS, we are using NGROK to tunnel our local URIs to a hosted solution. You must configure the NGROK_AUTHTOKEN environment variable in your local .env

```sh
cp .env.example .env
```
Don't forget to set the NGROK_AUTHTOKEN!

## Deploy application via docker

To launch MyPSECars run the following command: 

```sh
docker compose --profile prod up --build -d
```

Builds and runs every service in containers. Use this to verify the production setup, not for day-to-day development.

## Architecture

This monorepo contains one shared frontend and multiple microservices.

```
packages/
├── frontend/              # Next.js frontend (served to the browser, port 3000)
├── car_models/            # Car catalogue API (port 4001)
├── webshop/               # Webshop API with cart, orders, and Redis sessions (port 4003)
├── service-mypsecars/     # MyPSECars service — MQTT-driven car telemetry (port 4004)
├── service-world-drive/   # World Drive service — leaderboard and driving simulation (port 4005)
└── backend/               # Template microservice — copy this to get started
```

Each microservice is an independent Express server with its own port, database connection, and MQTT client. They all share the same Docker Compose setup.

## Creating a new microservice

1. Copy `packages/backend` to `packages/<your-service-name>`
2. Update `name` in `packages/<your-service-name>/package.json`
3. Add a new service entry in `docker-compose.yml` (use an existing service as reference)
4. Pick a free port and set it in `.env`

## Project structure

```
.
├── packages/
│   ├── frontend/                      # Next.js frontend (port 3000)
│   │   ├── app/                       # Next.js App Router pages and layouts
│   │   │   ├── (features)/            # Feature routes (car-configurator, webshop, world-drive, …)
│   │   │   ├── (mobile)/              # Mobile-specific routes
│   │   │   ├── _components/           # Shared React components
│   │   │   ├── _lib/                  # API clients, MQTT helpers, constants
│   │   │   ├── _types/                # Shared TypeScript types
│   │   │   └── api/                   # Next.js API route handlers
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── car_models/                    # Car catalogue API (Express, port 4001)
│   │   ├── prisma/
│   │   │   └── schema.prisma          # Car model definitions
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point
│   │   │   ├── db.ts                  # Prisma client singleton
│   │   │   ├── minio.ts               # MinIO client (image storage)
│   │   │   ├── mqtt.ts                # MQTT client
│   │   │   ├── seed.ts                # Database seed script
│   │   │   └── swagger/               # OpenAPI/Swagger docs
│   │   ├── prisma.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── webshop/                       # Webshop API (Express, port 4003)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Webshop model definitions
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point
│   │   │   ├── db.ts                  # Prisma client singleton
│   │   │   ├── minio.ts               # MinIO client
│   │   │   ├── mqtt.ts                # MQTT client
│   │   │   ├── redis.ts               # Redis client (sessions / cache)
│   │   │   ├── seed.ts
│   │   │   ├── jobs/                  # Background jobs
│   │   │   ├── middleware/            # Express middleware
│   │   │   ├── routes/                # Route handlers
│   │   │   └── swagger/               # OpenAPI/Swagger docs
│   │   ├── prisma.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── service-mypsecars/             # MyPSECars service (Express, port 4004)
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point
│   │   │   ├── mqtt/                  # MQTT subscriptions and handlers
│   │   │   ├── routes/                # Route handlers
│   │   │   ├── services/              # Business logic
│   │   │   └── swagger/               # OpenAPI/Swagger docs
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── service-world-drive/           # World Drive service (Express, port 4005)
│   │   ├── prisma/
│   │   │   └── schema.prisma          # Leaderboard / session model definitions
│   │   ├── scripts/
│   │   │   ├── seed.ts                # Database seed script
│   │   │   └── simulate.ts            # Driving simulation script
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point
│   │   │   ├── db.ts                  # Prisma client singleton
│   │   │   ├── types.ts               # Shared TypeScript types
│   │   │   ├── mqtt/                  # MQTT subscriptions and handlers
│   │   │   ├── routes/                # Route handlers
│   │   │   └── services/              # Business logic
│   │   ├── prisma.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/                       # Template microservice — copy this to get started
│       ├── src/
│       │   └── index.ts
│       ├── Dockerfile
│       └── package.json
├── mosquitto/
│   └── mosquitto.conf                 # Mosquitto broker config
├── docs/
│   ├── database.md                    # How to define models and run migrations (Prisma)
│   ├── docker.md                      # Docker profiles, commands, and how to run the stack
│   └── mqtt.md                        # MQTT setup, how to publish/subscribe, topic conventions
├── scripts/
│   ├── generate-env.sh                # Generates per-package .env files from the root .env
│   └── setup-dev.sh                   # First-time dev setup (deps, envs, DB migrations)
├── docker-compose.yml                 # Defines all services (use --profile dev or --profile prod)
└── .env.example                       # Copy to .env and fill in your values
```

## Infrastructure

| Service                       | What it is              | Port(s)                      |
|-------------------------------|-------------------------|------------------------------|
| PostgreSQL (car_models)       | Car catalogue database  | 5432                         |
| PostgreSQL (webshop)          | Webshop database        | 5433                         |
| PostgreSQL (service-world-drive) | World Drive database | 5434                         |
| Redis                         | Session / cache store   | 6379                         |
| Mosquitto                     | MQTT broker             | 1883 (TCP), 9001 (WebSocket) |
| MinIO                         | Object / file storage   | 9000 (API), 9002 (Web UI)    |

## Local development

### First-time setup

```sh
# 1. Start infrastructure (databases, MQTT, MinIO, Redis)
docker compose --profile dev up -d

# 2. Create a root .env (all values have safe defaults)
cp .env.example .env

# 3. Add NGROK_AUTHTOKEN to root .env

# 4. Install dependencies, generate per-package .env files, and set up databases
npm run setup-dev
```

`npm run setup-dev` runs `setup-dev.sh`, which:
- Calls `scripts/generate-env.sh` to create a `.env` for every package under `packages/`
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
npm run dev:car_models        # Car catalogue API    — http://localhost:4001
npm run dev:webshop           # Webshop API          — http://localhost:4003
npm run dev:service-mypsecars # MyPSECars service    — http://localhost:4004
npm run dev:world-drive       # World Drive service  — http://localhost:4005
npm run dev:frontend          # Next.js frontend     — http://localhost:3000
```

### Service URLs

| Service              | URL                      |
|----------------------|--------------------------|
| Frontend             | http://localhost:3000    |
| Car Models API       | http://localhost:4001    |
| Webshop API          | http://localhost:4003    |
| MyPSECars Service    | http://localhost:4004    |
| World Drive Service  | http://localhost:4005    |
| MinIO Web UI         | http://localhost:9002    |


## Documentation

| Doc | Contents |
|-----|----------|
| [docs/docker.md](docs/docker.md) | Profiles, commands, `-d` flag, logs |
| [docs/database.md](docs/database.md) | Adding models, running migrations, using Prisma |
| [docs/mqtt.md](docs/mqtt.md) | Publishing, subscribing, topic conventions |
