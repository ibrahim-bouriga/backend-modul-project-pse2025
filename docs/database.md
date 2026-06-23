# Database

PostgreSQL via **Prisma**. Each service has its own schema (e.g., `packages/car_models/prisma/schema.prisma`) with a generated client in `src/generated/prisma/`.

## Prerequisites

Postgres must be running:
```sh
docker compose --profile dev up -d
```

Then run the setup script (includes database initialization):
```sh
npm run setup
```

## Adding a model

Edit the service's `prisma/schema.prisma` (e.g., `packages/car_models/prisma/schema.prisma`):

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  createdAt DateTime @default(now())
}
```

Then apply the schema to the database:
```sh
cd packages/car_models
npx prisma migrate dev --name add_post
```

This creates a migration file, applies it to the database, and regenerates the client.

## Using the client

Import the singleton from `src/db.ts`:

```ts
import { prisma } from './db';

const posts = await prisma.post.findMany();
await prisma.post.create({ data: { title: 'Hello' } });
```

## Common commands

| Command | When to use |
|---|---|
| `npx prisma migrate dev --name <name>` | Adding/changing models — creates a timestamped migration file for the team to share |
| `npx prisma db push` | Quick local testing — applies changes directly without saving migration history |
| `npx prisma generate` | After `git pull` if schema changed — regenerates client code |
| `npx prisma studio` | Inspect/edit data in browser at `http://localhost:5555` |
| `npx prisma migrate reset` | Danger: drops DB and reruns all migrations from scratch (dev only) |

## After pulling changes

If someone else modified the schema:

```sh
cd packages/car_models
npx prisma migrate deploy      # Apply any new migrations they created
npx prisma generate            # Regenerate client (usually automatic)
```

## `db push` vs. `migrate dev` — when to use which

### Use `npx prisma migrate dev --name <name>`:
- You're modifying the schema and multiple developers will pull your changes
- You want a permanent Git history of what changed and when
- Someone else will need to apply your changes (`npx prisma migrate deploy`)

**Example workflow:**
```sh
# You make a schema change
cd packages/car_models
npx prisma migrate dev --name add_fuel_type
git add prisma/migrations/
git commit -m "add fuel_type column to CarModel"

# Teammate pulls and runs
npx prisma migrate deploy
```

### Use `npx prisma db push`:
- You're testing schema changes locally and haven't committed yet
- You want to quickly sync your schema without creating migration files
- No one else needs to see the intermediate steps

**Example workflow:**
```sh
# Quick local testing
cd packages/car_models
npx prisma db push
# Test your code...
# Don't like the schema? Change it and run db push again
```

### Current setup:
Your `setup-dev.sh` script is **smart**: it checks if `prisma/migrations/` exists. If it does, it runs `npx prisma migrate deploy` (team-safe). If not, it runs `npx prisma db push` (local-only).

- **`car_models`**: No migrations folder → uses `db push` (local experimentation)
- **`webshop`**: Has migrations folder → uses `migrate deploy` (team coordination)

When `car_models` grows and needs team coordination, create the first migration:
```sh
cd packages/car_models
mkdir -p prisma/migrations
npx prisma migrate dev --name init
```

Then `setup-dev.sh` will automatically use `migrate deploy` for everyone going forward.
