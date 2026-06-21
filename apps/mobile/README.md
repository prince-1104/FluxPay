# FluxPay Mobile (Expo)

Android/iOS client for FluxPay — synced with the web app.

## Setup

```bash
# From repo root
pnpm install
pnpm --filter mobile generate-assets
```

## Configure API URL

Set your backend URL before building or running on a physical device:

```bash
# .env in apps/mobile or root (Expo reads EXPO_PUBLIC_*)
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000/api/v1
```

- **Android emulator**: `http://10.0.2.2:4000/api/v1` (default in app.json)
- **Physical device**: use your computer's LAN IP, e.g. `http://192.168.1.5:4000/api/v1`

## Run locally

```bash
pnpm --filter mobile start
```

## EAS / Android build

Project linked to Expo: **fluxpay** (`48dad9ee-2a29-43cb-9aa8-1146b0f616a3`)

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build --platform android --profile preview
```

`preview` produces an **APK** for testing. Update `EXPO_PUBLIC_API_URL` in `eas.json` to your deployed API before production builds.

## Features (parity with web)

| Feature | Mobile |
|---------|--------|
| Login / Register | ✓ |
| Dashboard stats | ✓ |
| Trips list, create, join | ✓ |
| Trip detail: expenses, balances, settlements, members | ✓ |
| Add expense (equal split) | ✓ |
| Add / remove members | ✓ |
| Settle up | ✓ |
| Friends search & requests | ✓ |
| Notifications | ✓ |
| Settings / profile | ✓ |
| Copy invite code | ✓ |
