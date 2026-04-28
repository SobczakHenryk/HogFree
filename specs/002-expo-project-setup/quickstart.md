# Quickstart: PostHogMobile

> Get the app running locally in under 5 minutes.

## Prerequisites

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Expo Go installed on your phone **or** Android/iOS emulator configured

---

## 1. Install dependencies

```bash
cd app/PostHogMobile
npm install
```

Expected output: no errors, `node_modules/` created.

---

## 2. Start the development server

```bash
npx expo start
```

A QR code and menu appear in the terminal.

---

## 3. Open the app

**On a physical device:**
- Open **Expo Go** → scan the QR code.

**On an Android emulator:**
- Press `a` in the terminal.

**On an iOS simulator (macOS only):**
- Press `i` in the terminal.

---

## 4. Verify it works

You should see the **API Key** onboarding screen:
- Dark background (`#0D0D0D`)
- Input field with placeholder `phc_...`
- PostHog orange button

If the screen is styled correctly, NativeWind is working.

---

## 5. (Optional) Type-check the project

```bash
npx tsc --noEmit
```

Expected output: zero errors.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Cannot find module 'expo-router/entry'` | Wrong `main` in `package.json` | Check `"main": "expo-router/entry"` |
| App renders but all backgrounds are white | NativeWind not configured | Verify `global.css` is imported in `_layout.tsx` and `metro.config.js` uses `withNativeWind` |
| `Module not found: 'nativewind/babel'` | `tailwindcss` not installed | Run `npm install` again; check `tailwindcss` is in devDependencies |
| TypeScript errors about `className` prop | `nativewind/types` not found | Ensure `nativewind` is installed; check `tsconfig.json` includes `"src/**/*"` |
| SecureStore error on Android emulator | Emulator lacks hardware keystore | Use a physical device or enable secure storage in emulator settings |
| `Unable to find expo in this project` | Running from wrong directory | `cd app/PostHogMobile` before running `npx expo start` |
