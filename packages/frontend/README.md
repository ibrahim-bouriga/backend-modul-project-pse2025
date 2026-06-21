# Frontend

Next.js (App Router) frontend for the PSE 2025 project.

## Local development

> **Do not run Docker inside this folder.** Use the root `docker-compose.yml` for all infrastructure (Postgres, MQTT, MinIO). Run the frontend directly on your machine.

### Easiest: start everything from the repo root


## App structure

```
app/
├── layout.tsx                  ← root layout (fonts, global metadata)
├── page.tsx                    ← homepage (hero + feature tile grid)
├── _components/
│   ├── Header.tsx              ← shared nav bar
│   └── Footer.tsx              ← shared footer
└── (features)/
    ├── layout.tsx              ← wraps every feature page with Header + Footer
    ├── car-overview/
    ├── car-configurator/
    ├── world-drive/
    ├── merchandise/
    ├── MyPSECar/
    └── example/                ← reference implementation
```

The `(features)` folder is a [Next.js Route Group](https://nextjs.org/docs/app/building-your-application/routing/route-groups). The parentheses are **not** part of the URL — `/car-overview` is still `/car-overview`. The group just lets all feature pages share a single `layout.tsx` that injects the header and footer automatically.

## Feature pages

Each collaborator owns a route folder under `app/(features)/`. They follow this pattern:

```
app/(features)/
  <your-feature>/
    page.tsx                  ← the route (server component by default)
    _components/
      YourWidget.tsx          ← interactive parts ("use client")
    _lib/
      data.ts                 ← fetch helpers, types, utils (not routable)
```

Your `page.tsx` just returns its content — the header and footer are added automatically by `(features)/layout.tsx`. You do not need to import or wrap anything.

All of the logic of your feature should be built in your own folder to avoid merge conflicts.

## Server vs. Client Components

| Need | Declaration |
|---|---|
| `useState`, `useEffect`, event handlers, browser APIs | `"use client"` at top of file |
| Data fetching, DB access, no interactivity | Nothing — server by default |

Keep `page.tsx` a server component and push interactive parts into `_components/` with `"use client"`.

---

## Connecting to the backend

Import `BACKEND_URL` from the shared helper:

```ts
import { BACKEND_URL } from "@/app/_lib/api";

const res = await fetch(`${BACKEND_URL}/api/your-endpoint`);
```

Override the URL via `NEXT_PUBLIC_BACKEND_URL` in `.env.local`.

---

## Production build

Production builds are handled by the root `docker-compose.yml`. Do not build or run the container manually from this folder.

```bash
# from repo root
docker compose --profile prod up --build
```
