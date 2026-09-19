# Habit Garden

Habit Garden is a free, privacy-friendly and open-source habit tracker for the
web and Android. It is local-first: habits and check-ins stay on the user's
device and the core experience does not require an account or paid service.

## Features

- Create, edit, archive and delete habits
- Daily check-ins with streaks and weekly goals
- Weekly progress grid and pattern insights
- Light and dark themes
- JSON backup export and import on the web
- Responsive web app and native Expo Android app
- No ads, tracking or mandatory account

## Project structure

- `artifacts/habit-garden-web` — React + Vite website
- `artifacts/habit-garden-mobile` — Expo / React Native app

## Development

This repository uses pnpm workspaces.

```bash
pnpm install
pnpm --filter @workspace/habit-garden-web run typecheck
pnpm --filter @workspace/habit-garden-mobile run typecheck
```

Use the configured Replit workflows to run both applications locally.

## Netlify

The included `netlify.toml` builds and publishes the web app automatically.
Import this repository in Netlify and accept the detected settings.

## Android

Open the mobile preview with Expo Go during development. The Expo project uses
the Android application id `com.habitgarden.app`.

## Privacy

Habit Garden stores application data locally in browser `localStorage` or
mobile `AsyncStorage`. Clearing browser/app data removes it, so users should
export a JSON backup from the web app when appropriate.

## License

MIT