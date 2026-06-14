# Database

PostgreSQL via **Prisma**. Schema lives in `packages/backend/prisma/schema.prisma`, generated client in `packages/backend/src/generated/prisma`.

## Prerequisites

Postgres must be running:
```sh
docker compose --profile dev up
docker compose --profile dev up -d # if you want it to run in the background
```

## Adding a model

Edit `packages/backend/prisma/schema.prisma`:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  createdAt DateTime @default(now())
}
```

Then apply and regenerate:
```sh
cd packages/backend
npx prisma migrate dev --name add_post
```

This creates a migration file under `prisma/migrations/`, runs it against the DB, and updates the generated client.

## Using the client

Import the singleton from `src/db.ts`:

```ts
import { prisma } from './db';

const posts = await prisma.post.findMany();
await prisma.post.create({ data: { title: 'Hello' } });
```

## Common commands

| Command | What it does |
|---|---|
| `npx prisma migrate dev --name <name>` | Apply schema changes + regenerate client |
| `npx prisma generate` | Regenerate client without migrating (e.g. after `git pull`) |
| `npx prisma migrate reset` | Drop DB, re-run all migrations (dev only) |
| `npx prisma studio` | Open browser GUI at `http://localhost:5555` |

## After pulling changes

If someone else added a migration, run:
```sh
cd packages/backend
npx prisma migrate dev
npx prisma generate
```
