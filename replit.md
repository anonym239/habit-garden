# Habit Garden

An open-source, local-first habit tracker for the web and Android.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/habit-garden-web run dev` — run the web app via its workflow
- `pnpm --filter @workspace/habit-garden-mobile run dev` — run the Expo app via its workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React, Vite, Tailwind CSS, localStorage
- Mobile: Expo Router, React Native, AsyncStorage

## Where things live

- Web product: `artifacts/habit-garden-web`
- Android product: `artifacts/habit-garden-mobile`
- Netlify config: `netlify.toml`

## Architecture decisions

- Local-first by default, so the core product remains free and usable without an account.
- The website and mobile app intentionally use platform-native local persistence.
- The repository is MIT licensed.

## Product

Users can create and manage habits, record daily check-ins, view streaks and
weekly progress, customize the theme, and keep their data private on-device.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
