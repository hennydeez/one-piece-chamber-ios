# One Piece Chamber

Expo + React Native + TypeScript iOS app for tracking a **One Piece TCG** collection.

Photograph raw cards or PSA / BGS / TAG slabs, persist them in SQLite, attempt on-device OCR to prefill fields, and look up a stamped **Last-5 avg (AUD)** from completed solds that match Scout rules.

This repository does **not** ship licensed One Piece artwork. The UI is an original dark “chamber” theme with a geometric vault mark.

| | |
| --- | --- |
| App name | One Piece Chamber |
| Bundle id | `com.hennydeez.onepiecechamber` |
| Tabs | Collections · Add Card · Comps |
| App version | `0.4.2` |

## What v0.4.2 does

- **Last-5 table** — after Get comps, one table of the newest 5 completed solds (Date, AUD, BIN/Auc, eBay). Optional API `title` sits under the date. Then one **Last-5 avg (AUD)** of those rows. BIN and auction are merged. `n=0` is an empty table + Unavailable. No sample solds.

## What v0.4.1 does

- **Expo Go comps** — `npx expo start` / Expo Go do not load `eas.json` env. The public Chamber `comps.php` URL is now baked in, so `createCompsService()` always uses `HttpCompsService` when `EXPO_PUBLIC_COMPS_API_URL` is blank. `.env` is optional. After you pull, restart Metro with cache clear: `npx expo start -c`.
- **No leftover samples** — stub / `example.invalid` / SAMPLE solds are dropped. They never render on Last-5 rows. Nothing is invented.
- **Listing title** — when the API sends optional `title` on a sold, Last-5 rows show it so live listings do not look blank/fake.

## What v0.4 does

- **Grade chips** — Add Card (and Comps) pick a grade from chips. PSA and TAG: 1–10 integers. BGS: 7, 7.5, 8, 8.5, 9, 9.5, 10. Raw still hides grade. Hint stays `Numbers only.` Existing numeric helpers still validate on save.
- **Comps photo** — after **Get comps**, the searched card image shows (collection match or draft photo). It shows even when solds are empty / unconfigured. Nothing is invented.
- **Live comps URL** — public Chamber `comps.php` is the default: `https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php`. EAS still sets `EXPO_PUBLIC_COMPS_API_URL`. Expo Go does not need `.env` (v0.4.1).

## What v0.3 does

- **Save in Expo Go** — Add Card writes the SQLite row *before* any photo-file work. Missing `ExpoAsset` / `ExponentConstants` / `expo-file-system` JS cannot take down `main` and lose the card.
- **Photo copy** — uses native `ExponentFileSystem` only. Never imports `expo-file-system` or `expo-asset` JS on save (those call `requireNativeModule` at load and red-screen Expo Go). If the native module is missing, the picker/camera URI is stored as-is.
- **After save** — opens card detail (`router.push`). Back still works. Collections fallback if routing throws.
- **OCR in Expo Go** — still a soft-fail: `OCR needs a full app build. Type it in.` No claim that OCR works in Expo Go.
- **Comps** — sample / `example.invalid` rows are gone. With no `EXPO_PUBLIC_COMPS_API_URL`, Get comps shows empty / unavailable. When the URL is set, `HttpCompsService` fetches last ≤5 completed solds, stamps **Last-5 avg (AUD)**, and keeps tappable `sourceUrl`s. Nothing is invented on error or n=0.
- **Language** — Global (EN / worldwide) and Jap (JP) buttons only. Those never mix.
- **Grade** — numbers only. Hidden on Raw. PSA = whole numbers. BGS = decimals ok. TAG = integer or one decimal (pending a firmer rule). v0.4 picks these from chips.

### Scout match (code, not UI)

Completed solds only. Match is code + print + language + grade. Raw is never a slab. Newest first, max 5, BIN + auction merged. AUD or FX-stamped conversions only.

**Live solds:** Chamber `comps.php` is the baked-in default (also in `.env.example` and `eas.json`):

`https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php`

Payload shape is in `.env.example`. Public URL only — no secrets. This app does not scrape eBay. After a pull, Expo Go needs `npx expo start -c` so the new default is picked up.

## What v0.2 did

- **Collections** — two-column card grid, empty state, tap through to detail.
- **Add Card** — camera or library. OCR autofill on EAS / dev client.
- **OCR in Expo Go** — soft-fail, manual fields. Save was supposed to work (fixed for real in v0.3).
- **Comps** — last-5 + Last-5 avg (AUD). v0.2 still shipped SAMPLE stub rows; v0.3 removed them.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- `expo-camera`, `expo-image-picker`, `expo-sqlite`
- OCR via `expo-text-extractor` (Apple Vision / ML Kit) behind an `OcrService` interface
- EAS Build profiles in `eas.json` (cloud iOS builds from Windows)

**OCR host split**

| Host | After a card photo |
| --- | --- |
| Expo Go | Soft-fail. `OCR needs a full app build. Type it in.` Fields stay manual. |
| EAS development client / TestFlight / production | OCR runs and autofills extracted fields. Review before save. |
| Web preview | Same soft-fail as a missing native module. Fields stay manual. |

The custom camera view still needs a **development build** or TestFlight binary for the full in-app shutter. Expo Go can still open the three tabs, pick a library photo, save cards, and show the comps UI.

## Windows: run locally

1. Install [Node.js LTS](https://nodejs.org/) (20+) and Git.
2. Clone and install:

   ```bat
   git clone https://github.com/hennydeez/one-piece-chamber-ios.git
   cd one-piece-chamber-ios
   npm install
   ```

3. Start Metro:

   ```bat
   npx expo start
   ```

4. Scan the QR code with Expo Go on Android, or press `w` for web.

Web is a UI preview only. This SDK build of `expo-sqlite` does not ship `wa-sqlite.wasm`, so the web bundle uses an in-memory collection (refresh clears cards). iOS / EAS / Expo Go persist to SQLite.

Windows cannot compile an iOS binary. Use EAS (below) for a device build, camera, and OCR.

v0.3 save in Expo Go does not require a custom native binary. Add Card writes SQLite first; photo file-copy is best-effort.

### Scripts

```bat
npm test
npm run typecheck
npx expo start
```

`.env` is optional. The public Chamber `comps.php` URL is baked into the app. Copy `.env.example` only if you want to override it. After you pull, restart Expo Go with `npx expo start -c` so Metro picks up the default. EAS profiles still set the same public URL.

## EAS iOS build + TestFlight (from Windows)

You need an [Expo](https://expo.dev) account and an Apple Developer Program membership.

1. Install and log in:

   ```bat
   npm install
   npx eas-cli login
   npx eas-cli init
   ```

   `eas init` writes a real `extra.eas.projectId` into `app.json`. Commit that change.

2. Configure Apple credentials when EAS asks (it can generate a distribution cert and provisioning profile, or you can supply yours).

3. **Development client** (full camera + OCR on a physical iPhone):

   ```bat
   npx eas-cli build --platform ios --profile development
   ```

   Install the build on the device, then run `npx expo start --dev-client` from Windows.

4. **TestFlight / App Store Connect**:

   ```bat
   npx eas-cli build --platform ios --profile production
   ```

   After the build finishes:

   ```bat
   npx eas-cli submit --platform ios --profile production
   ```

   Put your App Store Connect app id in `eas.json` → `submit.production.ios.ascAppId` (create the app record in App Store Connect first: bundle id `com.hennydeez.onepiecechamber`).

`preview` uses the same store distribution as production but a separate update channel, useful for internal TestFlight groups before a numbered release.

EAS compiles in the cloud, so these commands are valid on Windows. You do not need Xcode or a Mac for the build itself. Apple may still require a Mac later for some Agreement / capability screens; EAS handles signing if credentials are in place.

## Project layout

```
app/(tabs)/          Collections, Add Card, Comps
app/card/[id].tsx    Detail
app/capture.tsx      expo-camera modal
src/db/              SQLite schema + repository
src/models/          Card + comps types
src/services/ocr/    OCR interface + parser
src/services/comps/  CompsService, Scout match, Last-5 avg
```

## Honesty rules

- OCR messages say it missed, needs a full build, or to check the fields. Prefill is never treated as confirmed.
- Comps use the baked-in Chamber `comps.php` URL unless you override `EXPO_PUBLIC_COMPS_API_URL`. No sample prices. No leftover stub / `example.invalid` rows.
- **Last-5 avg (AUD)** is `Unavailable` when `n=0`.
- No ripped One Piece IP art is included.

## License

App source is provided for this repository. Expo template assets remain under the Expo MIT license in `LICENSE`.
