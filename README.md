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
- Google Play and Apple App Store Pro purchases through RevenueCat
- Pro status shared with the website when the same account is used
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

Netlify hosts the static web interface only. The API server must remain on a
server runtime such as a published Replit deployment because it performs
authenticated cloud sync, AI requests and app-store entitlement checks.

Configure these Netlify environment variables before publishing:

- `VITE_API_BASE_URL` — the published API origin, for example
  `https://your-api.example.com` (without `/api`)
- `VITE_CLERK_PUBLISHABLE_KEY` — the production Clerk publishable key
- `VITE_CLERK_PROXY_URL` — the Clerk proxy URL exposed by the published API

Never add RevenueCat secret keys, DeepInfra keys or Clerk secret keys to
Netlify's frontend variables. Pro purchases are available only inside the
Android and iPhone apps through their official app stores.

## Android

Open the mobile preview with Expo Go during development. The Expo project uses
`com.habitgarden.app` as its Android application id and iOS bundle identifier.

Installable Android APKs are built by the `Android APK Release` GitHub Actions
workflow and attached to the matching entry under GitHub Releases. The workflow
requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` as GitHub Actions variables.

## Privacy

Habit Garden stores application data locally in browser `localStorage` or
mobile `AsyncStorage`. Clearing browser/app data removes it, so users should
export a JSON backup from the web app when appropriate.

## License

MIT