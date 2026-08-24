# Daily Quote OTA

React Native (Android) app with a **self-built OTA update system** — no CodePush, no Expo.

Monorepo managed with **pnpm workspaces**.

```
daily-quote-ota/
├── mobile/   ← React Native 0.87 (Android-only)
└── server/   ← NestJS + Prisma + SQLite  (OTA backend)
```

---

## Prerequisites

| Tool             | Required version                     |
| ---------------- | ------------------------------------ |
| Node.js          | 18+                                  |
| pnpm             | 11+                                  |
| JDK              | 17 (Zulu recommended)                |
| Android SDK      | API 35, build-tools 35               |
| Android Emulator | AVD "Pixel_9" (or any API 35 device) |

Set `ANDROID_HOME` to your SDK path, e.g.:

```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 1 · Install dependencies

```bash
# from repo root
pnpm install
```

---

## 2 · Run the OTA server

```bash
# copy env (first time only)
cp server/.env.example server/.env
# edit server/.env — set OTA_ADMIN_API_KEY to any secret string

cd server
pnpm run start:dev        # dev mode with hot-reload, listens on :3000
# or
pnpm run start:prod       # production (after pnpm run build)
```

Key env vars in `server/.env`:

| Variable            | Default         | Purpose                     |
| ------------------- | --------------- | --------------------------- |
| `DATABASE_URL`      | `file:./dev.db` | SQLite path (Prisma)        |
| `OTA_ADMIN_API_KEY` | _(must set)_    | API key for admin endpoints |
| `PORT`              | `3000`          | HTTP port                   |

---

## 3 · Run the mobile app (development)

**Start Metro bundler** (separate terminal):

```bash
cd mobile
pnpm run start --reset-cache
```

**Run on emulator / device**:

```bash
cd mobile
pnpm run android
# or from repo root:
pnpm --filter mobile run android
```

The app reads `mobile/.env.development` for config.  
`OTA_SERVER_URL=http://10.0.2.2:3000` — `10.0.2.2` is Android emulator's alias for `localhost` on the host machine.

For a **physical device** change this to your machine's LAN IP, e.g. `http://192.168.1.x:3000`.

---

## 4 · Build a release APK

```bash
cd mobile/android
./gradlew assembleRelease
# APK → mobile/android/app/build/outputs/apk/release/app-release.apk
```

> **Signing**: the release build requires a keystore. Add these to `mobile/android/local.properties` or as env vars before building:
>
> ```
> MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
> MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
> MYAPP_UPLOAD_STORE_PASSWORD=***
> MYAPP_UPLOAD_KEY_PASSWORD=***
> ```

Debug APK (no signing needed):

```bash
cd mobile/android
./gradlew assembleDebug
# APK → mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5 · Build & publish an OTA bundle

An OTA update is a **JS bundle only** — no native recompile needed.

**Step 1 — bundle JS**:

```bash
cd mobile
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/ota-bundle/index.android.bundle \
  --assets-dest /tmp/ota-bundle/
```

**Step 2 — zip it** (server expects a `.zip` containing the bundle):

```bash
cd /tmp/ota-bundle
zip -r bundle.zip index.android.bundle
```

**Step 3 — upload to server**:

```bash
curl -X POST http://localhost:3000/ota/android/releases \
  -H "x-api-key: YOUR_ADMIN_API_KEY" \
  -F "bundle=@/tmp/ota-bundle/bundle.zip" \
  -F "version=1.0.1" \
  -F "nativeVersion=1.0" \
  -F "mandatory=false" \
  -F "changelog=Bug fixes and improvements"
```

`nativeVersion` must match `versionName` in `mobile/android/app/build.gradle` (currently `"1.0"`).  
`mandatory=true` forces an un-dismissible update modal on the device.

**List existing releases**:

```bash
curl http://localhost:3000/ota/android/releases \
  -H "x-api-key: YOUR_ADMIN_API_KEY"
```

---

## 6 · How the OTA system works

```
App starts
  └─ OTABootstrap.kt   checks ota-bundles/ dir for a staged bundle
       └─ if found: swaps it as the active JS bundle before RN loads
  └─ App.tsx           calls OTAModule.confirmUpdate() to mark current bundle "confirmed"

User taps "Check for Updates" (About screen)
  └─ GET /ota/android/check?nativeVersion=1.0&otaVersion=built-in
       └─ server returns latest compatible release or {upToDate: true}
  └─ OTAVersionManager validates: newer version + native version match
  └─ mandatory? → MandatoryUpdateModal   non-mandatory? → UpdateAvailableCard

User taps "Download & Install" / modal auto-triggers
  └─ otaClient.ts downloads ZIP → react-native-blob-util
  └─ OTAModule.verifyAndStage() — sha256 check, unzip, move to staging
  └─ App restarts via AlarmManager (schedules relaunch, kills process)
  └─ Next boot: OTABootstrap picks up staged bundle → live
```

---

## 7 · Where to change what

### Change OTA server URL (mobile)

| Environment    | File                      | Variable         |
| -------------- | ------------------------- | ---------------- |
| Dev (emulator) | `mobile/.env.development` | `OTA_SERVER_URL` |
| Production     | `mobile/.env.production`  | `OTA_SERVER_URL` |

### Change admin API key (server)

`server/.env` → `OTA_ADMIN_API_KEY`

### Change app version

| What                       | File                              | Field                |
| -------------------------- | --------------------------------- | -------------------- |
| Native version             | `mobile/android/app/build.gradle` | `versionName`        |
| Native version (JS mirror) | `mobile/src/constants/appInfo.ts` | `APP_NATIVE_VERSION` |
| Build version code         | `mobile/android/app/build.gradle` | `versionCode`        |

> **Important**: `APP_NATIVE_VERSION` in `appInfo.ts` **must** stay in sync with `versionName` in `build.gradle`. OTA compatibility checks compare these exact strings.

### Add a new screen

1. Create `mobile/src/screens/MyScreen.tsx`
2. Register in `mobile/src/navigation/RootNavigator.tsx`

### Change app name / bundle ID

| File                                                 | Field                 |
| ---------------------------------------------------- | --------------------- |
| `mobile/android/app/build.gradle`                    | `applicationId`       |
| `mobile/android/app/src/main/res/values/strings.xml` | `app_name`            |
| `mobile/app.json`                                    | `name`, `displayName` |

---

## 8 · Project structure

```
mobile/
├── App.tsx                        ← root component, OTA confirmUpdate on boot
├── global.css                     ← NativeWind global styles
├── index.js                       ← RN entry point
├── src/
│   ├── components/
│   │   ├── MandatoryUpdateModal.tsx   ← blocking modal for mandatory updates
│   │   └── UpdateAvailableCard.tsx    ← dismissible card for optional updates
│   ├── constants/
│   │   └── appInfo.ts                 ← APP_NATIVE_VERSION constant
│   ├── native/
│   │   └── OTAModule.ts               ← typed JS wrapper for Kotlin OTAModule
│   ├── navigation/
│   │   └── RootNavigator.tsx          ← bottom-tab navigator
│   ├── screens/
│   │   ├── AboutScreen.tsx            ← OTA status UI + check for updates
│   │   └── HomeScreen.tsx             ← daily quote display
│   ├── services/
│   │   ├── OTAVersionManager.ts       ← version comparison logic
│   │   └── otaClient.ts               ← HTTP calls to OTA server
│   └── store/
│       └── useOtaStore.ts             ← Zustand OTA state machine
└── android/app/src/main/java/com/dailyquoteota/app/
    ├── MainApplication.kt             ← OTABootstrap wired here
    ├── OTABootstrap.kt                ← swaps JS bundle before RN loads
    ├── OTAModule.kt                   ← Native module (verify, stage, restart)
    ├── OTAPaths.kt                    ← file path constants
    └── OTAPackage.kt                  ← registers OTAModule with RN

server/
├── src/ota/
│   ├── ota.controller.ts              ← GET /ota/android/check (public)
│   ├── ota-admin.controller.ts        ← POST /ota/android/releases (admin)
│   ├── ota.service.ts                 ← release creation, check logic
│   ├── ota-storage.util.ts            ← ZIP extraction, file storage
│   └── guards/admin-api-key.guard.ts  ← x-api-key header check
└── prisma/schema.prisma               ← Release model (SQLite)
```

---

## 9 · Run tests

```bash
# mobile unit tests
cd mobile
npx jest --watchAll=false

# specific test suite
npx jest --watchAll=false --testPathPattern="OTAVersionManager"

# server tests
cd server
pnpm test
```

---

## 10 · Tech stack

| Layer                | Technology                                   |
| -------------------- | -------------------------------------------- |
| Mobile framework     | React Native 0.87 (New Architecture, Hermes) |
| Styling              | NativeWind 4 (Tailwind CSS)                  |
| State management     | Zustand 5                                    |
| Navigation           | React Navigation 7 (bottom tabs)             |
| HTTP / file download | react-native-blob-util                       |
| Native config        | react-native-config                          |
| Backend              | NestJS                                       |
| Database             | SQLite via Prisma                            |
| Package manager      | pnpm 11 (workspaces)                         |
