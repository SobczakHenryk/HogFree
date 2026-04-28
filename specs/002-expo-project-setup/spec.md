# Feature Specification: Expo Project Setup

**Feature Branch**: `002-expo-project-setup`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Inicializar el proyecto Expo e instalar las dependencias para ejecutar la app PostHogMobile en Expo Go o emulador"

---

## Known Issues & Resolutions

### WorkletsError: Mismatch between JavaScript part and native part of Worklets (0.7.x vs 0.5.1)

**Symptom**: App fails to load with `[WorkletsError] Mismatch between JavaScript part and native part of Worklets (0.7.4 vs 0.5.1)`. All routes also warn "missing the required default export" because the module graph fails to load.

**Root cause**: `react-native-worklets` must be pinned to `0.5.1` — the exact version shipped in Expo Go's native binary for SDK 54. Any version like `^0.7.4` resolves to 0.7.x which mismatches the prebuilt native code in Expo Go.

**Resolution**:
1. Pin `react-native-worklets` to exactly `"0.5.1"` in `package.json` (no `^` or `~`).
2. Run `npm install` to install the correct version in `node_modules`.
3. Clear all caches — stale Metro and `.expo` cache will keep serving the old 0.7.x JS bundle even after `node_modules` is fixed:
   ```powershell
   # Kill any running Metro server first
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   # Delete caches
   Remove-Item -Recurse -Force .expo
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\metro-cache"
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\metro-file-map-*"
   # Restart with clean cache
   npx expo start --clear
   ```
4. Force-quit Expo Go on the device and reopen — the app must reconnect to get the freshly rebuilt bundle.

**Prevention**: Always use `npx expo install <package>` instead of `npm install <package>` for native modules. Expo's install command resolves the SDK-compatible version automatically.

### Expo CLI `TypeError: fetch failed` during `expo start`

**Symptom**: `npx expo start --clear` stops before serving the bundle and prints `TypeError: fetch failed` from Expo CLI internals.

**Root cause**: Expo CLI tries to validate native dependency versions against Expo's remote metadata service during startup. If the machine is offline, behind a proxy, or Expo's endpoint is temporarily unreachable, startup can fail before Metro fully serves the app.

**Resolution**:
1. If internet access is available, retry `npx expo start --clear` after confirming the network/proxy allows Node.js outbound HTTPS requests.
2. If the dependency set is already known-good, start Expo in offline mode:
   ```powershell
   npx expo start --offline --clear
   ```
3. If the app was already running with an older cached bundle, force-quit Expo Go after restarting Metro so the device reconnects to the fresh server.

**Note**: This error is separate from the Worklets mismatch. The Worklets issue is a dependency/version problem; `fetch failed` is a startup-time network problem in Expo CLI.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Runs the App for the First Time (Priority: P1)

A developer clones the repository and wants to execute the PostHogMobile app on their device or emulator. Currently the `app/PostHogMobile/src/` folder contains all source code but there is no `package.json`, no Expo configuration, and no build tooling — the app simply cannot be launched. After this feature, the developer runs a single install command, starts the dev server, and scans a QR code (or presses a key) to open the app in Expo Go or an emulator.

**Why this priority**: Without this, no other work can be validated on a real device. It is the foundation for every subsequent development and test cycle.

**Independent Test**: Can be fully tested by running `npx expo start` inside `app/PostHogMobile/` and confirming the app loads the API Key onboarding screen on a connected device or emulator.

**Acceptance Scenarios**:

1. **Given** a machine with Node.js and the repository cloned, **When** the developer runs `npm install` inside `app/PostHogMobile/`, **Then** all packages install without errors.
2. **Given** dependencies are installed, **When** the developer runs `npx expo start`, **Then** the dev server starts and a QR code is displayed in the terminal.
3. **Given** Expo Go is installed on a device, **When** the QR code is scanned, **Then** the app loads and displays the API Key screen.
4. **Given** an Android or iOS emulator is running, **When** the developer presses `a` or `i` in the dev server, **Then** the app opens in the emulator.

---

### User Story 2 - Developer Sees Correct Styling (Priority: P2)

After launching the app, the developer confirms that all visual styles are applied correctly: dark background, PostHog brand colors, Inter font, and all custom Tailwind utility classes render as expected.

**Why this priority**: NativeWind requires additional configuration (Babel plugin, Metro config, global CSS). Without it the app renders but shows completely unstyled components — black text on white background, no spacing, no custom colors.

**Independent Test**: Can be fully tested by visually inspecting the API Key screen and confirming it matches the intended dark-themed design with PostHog orange accents.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the API Key screen loads, **Then** the background is dark (not white), the input field has rounded borders, and the button shows the PostHog brand color.
2. **Given** the app is running, **When** a validation error occurs, **Then** the error message renders in red with correct typography (Inter font family).

---

### User Story 3 - TypeScript Type Checking Passes (Priority: P3)

A developer runs the TypeScript compiler and gets zero type errors across the entire `src/` directory, confirming the `tsconfig.json` is properly configured for Expo and React Native.

**Why this priority**: The source code is fully typed. Without correct `tsconfig.json`, the editor shows false errors and the build may fail.

**Independent Test**: Can be fully tested by running `npx tsc --noEmit` and confirming zero errors are reported.

**Acceptance Scenarios**:

1. **Given** dependencies are installed and `tsconfig.json` is configured, **When** `npx tsc --noEmit` is run, **Then** no type errors are reported.
2. **Given** VS Code is open on the project folder, **When** any source file is opened, **Then** no false TypeScript errors appear from misconfigured `tsconfig.json`.

---

### Edge Cases

- What happens if the developer uses Node.js below the minimum Expo-supported version?
- What happens if the device does not support SecureStore (e.g., certain Android emulators without hardware-backed keystore)?
- What happens if `npm install` is run from the wrong directory (repo root instead of `app/PostHogMobile/`)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST have a `package.json` inside `app/PostHogMobile/` declaring all runtime and dev dependencies required by the existing source code.
- **FR-002**: The project MUST include an Expo application configuration file (`app.json`) with a valid `scheme` field required by Expo Router's deep-linking.
- **FR-003**: The project MUST include a `tsconfig.json` that extends Expo's base TypeScript config and resolves all path aliases used in the source.
- **FR-004**: The project MUST include a `babel.config.js` that configures the NativeWind Babel plugin so that `className` props are transformed at build time.
- **FR-005**: The project MUST include a `metro.config.js` that configures Metro bundler with NativeWind support.
- **FR-006**: The project MUST include a `global.css` entry-point file that NativeWind uses to generate utility classes.
- **FR-007**: The project MUST include a `tailwind.config.js` that points to all source files under `src/` and declares the custom color tokens (`background`, `background-tertiary`, `border`, `text-primary`) and font families (`inter`) used by the existing components.
- **FR-008**: The following packages MUST be listed as runtime dependencies: `expo`, `expo-router`, `expo-haptics`, `expo-secure-store`, `expo-linking`, `@expo/vector-icons`, `@expo-google-fonts/inter`, `ky`, `nativewind`, `react`, `react-native`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`, `react-native-worklets`, `@gorhom/bottom-sheet`, `@shopify/flash-list`, `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `@react-native-async-storage/async-storage`, `date-fns`.
- **FR-009**: `tailwindcss`, `typescript`, `babel-preset-expo`, and `@types/react` MUST be listed as dev dependencies.
- **FR-010**: The root layout file (`src/app/_layout.tsx`) MUST import the `global.css` file so NativeWind styles are activated at app startup.
- **FR-011**: After `npm install`, running `npx expo start` MUST launch the Metro bundler without errors.

### Key Entities

- **Project Root** (`app/PostHogMobile/`): The installable unit — contains `package.json`, config files, and the `src/` directory with all application code.
- **Dependency Manifest** (`package.json`): Declares all packages needed to build and run the app, including exact or range-pinned versions compatible with each other.
- **Expo Config** (`app.json`): Declarative app metadata — name, slug, scheme, platform targets. Required for Expo Router and Expo Go compatibility.
- **NativeWind Config** (`tailwind.config.js` + `global.css`): Defines which Tailwind utility classes are generated and what custom design tokens (colors, fonts) are available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with a freshly cloned repository can have the app running on a device or emulator in under 5 minutes by following the quickstart steps.
- **SC-002**: Zero install errors when running `npm install` on a machine with a supported Node.js version.
- **SC-003**: Zero TypeScript errors when running `npx tsc --noEmit` against the existing `src/` code.
- **SC-004**: Zero unstyled components — all `className`-based styles render correctly on both iOS and Android.
- **SC-005**: The API Key onboarding screen is reachable and functional (can enter a key, see validation feedback) on the first run with no additional manual configuration.

## Assumptions

- The existing source code in `src/` is complete and correct — this spec covers only the project scaffolding, not changes to application logic.
- NativeWind v4 is used (CSS-first, compatible with Tailwind v3/v4 peer dependency).
- The app targets iOS and Android only (no web target required at this stage).
- The Inter font family is loaded via `@expo-google-fonts/inter` or equivalent; if not, a system sans-serif fallback is acceptable for initial setup.
- Node.js ≥ 18 is assumed as the minimum supported runtime (aligned with current Expo SDK requirements).

