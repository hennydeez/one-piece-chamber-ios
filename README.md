# One Piece Chamber

Expo + React Native + TypeScript iOS app for tracking a **One Piece TCG** collection.

Photograph raw cards or PSA / BGS / TAG slabs, persist them in SQLite, attempt on-device OCR to prefill fields, and look up a stamped **Last-5 avg (AUD)** from completed solds that match Scout rules.

This repository does **not** ship licensed One Piece artwork. The UI is an original dark “chamber” theme with a geometric vault mark.

| | |
| --- | --- |
| App name | One Piece Chamber |
| Bundle id | `com.hennydeez.onepiecechamber` |
| Tabs | Collections · Add Card · Comps |

## What v1 does

- **Collections** — two-column card grid, empty state, tap through to detail.
- **Add Card** — in-app camera (`expo-camera`) or photo library (`expo-image-picker`). Fields: card code, type (`Raw` \| `PSA` \| `BGS` \| `TAG`), grade, cert #, optional print note, language (default `EN`), purchase date, purchase price AUD, notes. OCR is best-effort and every prefilled value is editable.
- **Comps** — last ≤5 **completed solds** matching Scout rules. The stamp label is exactly **Last-5 avg (AUD)** (arithmetic mean of those AUD prices). If fewer than 5 solds match, `n` is shown honestly. Each sold row has a tappable **source link** (`sourceUrl`, optional `sourceLabel`) to the listing / PriceCharting / eBay sold page so you can check it. Fake prices are never labeled as live.

### Scout match

Completed solds only. A sold matches when **code ∧ print ∧ language ∧ grade** all match. Raw is never a slab. Newest first, max 5, **AUD first**, FX rate + timestamp stamped on conversions, auctions kept in a separate last-5 from fixed/BIN solds.

There is no live solds API wired in v0.1. A `CompsService` interface sits in front of a stub that returns **SAMPLE** rows (`sourceStatus: sample`) with fake `https://example.invalid/…` source URLs, each labeled “not live”. Those rows exist so source links can be tapped; they are not live solds and the Last-5 avg from them is not a live market figure. Set `EXPO_PUBLIC_COMPS_API_URL` later to use `HttpCompsService` — live rows should include `sourceUrl` (and optional `sourceLabel`). On error the HTTP provider still invents no prices.

## Stack

- Expo SDK 57, Expo Router, TypeScript
- `expo-camera`, `expo-image-picker`, `expo-sqlite`
- OCR via `expo-text-extractor` (Apple Vision / ML Kit) behind an `OcrService` interface
- EAS Build profiles in `eas.json` (cloud iOS builds from Windows)

OCR and the custom camera view need a **development build** or TestFlight binary. Expo Go can still open the three tabs, save cards, and show the comps UI; OCR will report that it is unsupported and leave fields manual.

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

### Scripts

```bat
npm test
npm run typecheck
npx expo start
```

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

- OCR messages say “attempted” or “failed”. Prefill is never treated as confirmed.
- The comps stub emits SAMPLE rows only, with `example.invalid` source URLs labeled “not live”. They are never presented as live solds.
- **Last-5 avg (AUD)** is hidden as `Unavailable` when `n=0`. A sample average is labeled as sample, not live.
- No ripped One Piece IP art is included.

## License

App source is provided for this repository. Expo template assets remain under the Expo MIT license in `LICENSE`.
