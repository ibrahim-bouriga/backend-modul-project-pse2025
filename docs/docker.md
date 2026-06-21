# Docker

## Profiles

| Profile | Services started | Use when |
|---|---|---|
| `dev` | postgres, mosquitto, minio, redis | Developing locally — run backend/frontend natively, just need the infrastructure |
| `prod` | postgres, mosquitto, minio, redis, backend, frontend | Running the full stack (e.g. staging, production, or a full local smoke test) |

## Commands

**Local development** (infra only, you run the app yourself):
```sh
docker compose --profile dev up -d
```

**Full stack** (everything in containers):
```sh
docker compose --profile prod up --build -d
```

**Tear down:**
```sh
docker compose --profile dev down
# or
docker compose --profile prod down
```

## `-d` vs without

| | Behaviour |
|---|---|
| With `-d` | Runs in the background, shell is free, logs hidden |
| Without `-d` | Logs stream to your terminal, `Ctrl+C` stops everything |

Omit `-d` when you want to watch logs while testing. Use `-d` once things are stable.

## Viewing logs

```sh
docker compose logs -f postgres     # follow postgres logs
docker compose logs -f redis        # follow redis logs
docker compose logs -f              # follow all services
```

## Services

### Redis

Redis is used for caching and session management.

**Port:** `6379` (configurable via `REDIS_PORT` in `.env`)

**Health check:** Runs `redis-cli ping` every 10 seconds

**Data persistence:** Stored in the `redis_data` volume

**Access Redis CLI:**
```sh
docker compose exec redis redis-cli
```

## Automatic migrations

The backend container runs `prisma migrate deploy` before starting. This applies any pending migrations automatically on each deployment — no manual step needed.

For local development (outside Docker), run migrations manually:
```sh
cd packages/backend
npx prisma migrate dev --name <your_change>
```
