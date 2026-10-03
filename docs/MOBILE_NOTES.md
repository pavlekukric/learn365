# Mobile Notes

Planning document for the future iOS / Android app. **Implementation is deferred until web v1 is visually approved.** This file fills in as decisions are made.

---

## 1. Status

- Mobile is **planned, not implemented** in phase 1.
- `apps/mobile` and `packages/ui-mobile` do not exist yet.
- This document is the staging ground for mobile decisions so the web architecture stays mobile-ready without prematurely shipping mobile code.

---

## 2. Platform target

- **iOS** — App Store, iPhone primary, iPad-friendly but not iPad-optimized in v1.
- **Android** — Google Play, modern phone form factors (Pixel-class). No tablet optimization in v1.

Minimum versions to be confirmed at mobile-phase kickoff; tentative baseline: iOS 16, Android 10.

---

## 3. Framework decision

**Expo (managed workflow) + React Native** with **expo-router**.

Reasoning:

- One TypeScript codebase ships both iOS and Android.
- EAS Build handles native binaries; no Xcode/Android Studio dependency on the dev machine for routine builds.
- OTA updates via EAS Update for non-native fixes.
- Aligns with the monorepo's shared `core` and `content` packages without an awkward bridging layer.

Alternative considered and rejected: full native (Swift + Kotlin). Doubles the engineering effort with no v1 benefit.

---

## 4. Architecture inheritance from web

The mobile app inherits **directly** from the shared packages:

| Shared                                                 | Reused on mobile?                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `@learn365/content`                                    | Yes, unchanged.                                                                        |
| `@learn365/core` (ProgressStore, selectors, prev/next) | Yes, unchanged. The storage adapter is replaced with an `AsyncStorage` implementation. |
| `@learn365/ui` (tokens, themes)                        | Yes — RN consumes the precomputed RGB token bundle (OKLCH is not supported in RN).     |
| `@learn365/ui-web`                                     | **No.** Mobile gets `@learn365/ui-mobile`, a parallel implementation.                  |

The component **contracts** match across `ui-web` and `ui-mobile` so the app code (route layer) is mostly platform-agnostic above the view layer.

When the backend (`apps/api`, see `docs/BACKEND_STRATEGY.md`) lands, the mobile app consumes **the same .NET 9 Web API** as the web app — there is no mobile-specific backend. Mobile swaps its storage adapter to `RemoteProgressStorage` (the same one the web app uses), backed by `AsyncStorage` for the offline write queue. Sign-in flow, sync semantics, and conflict resolution are identical to web.

---

## 5. Token bundle for mobile

`packages/ui` emits two artifacts:

- `dist/globals.css` for web (CSS variables)
- `dist/tokens.ts` for mobile (plain TS object, OKLCH → sRGB pre-converted with `culori` at build time)

Both are derived from the same source `src/tokens/*.ts`. The conversion produces tokens like:

```ts
export const tokens = {
  color: {
    bg: 'rgb(245, 243, 232)',
    ink: 'rgb(55, 50, 40)',
    accent: 'rgb(78, 110, 88)',
    // …
  },
  type: {
    /* … */
  },
  space: {
    /* … */
  },
};
```

The RN `ThemeProvider` wraps the app and exposes tokens via context. There is no runtime theme switching in v1.

---

## 6. Routing

`expo-router` with file-based routes mirroring web:

```
apps/mobile/app/
├─ _layout.tsx                              # ThemeProvider, ProgressStoreProvider, fonts
├─ index.tsx                                # Home
└─ course/[courseId]/
   ├─ index.tsx                             # Course overview
   └─ lesson/[lessonId].tsx                 # Lesson reader
```

Deep linking (e.g., a future "lesson of the day" notification) lands directly on `/course/.../lesson/<id>`.

---

## 7. Storage adapter

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const mobileStorage: ProgressStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
```

Key: `learn365:progress:v1` (same key as web for forward compatibility with future cloud sync that would unify them).

---

## 8. Component parity differences

Documented per-component differences from the web equivalents in `docs/COMPONENT_LIBRARY.md`:

- **`LessonBody` dropcap** — CSS float-based dropcap does not translate cleanly to RN text rendering. Likely strategy: render the first paragraph with an enlarged first character via a custom inline component, or fall back to a styled first paragraph without a true floated dropcap. Decision deferred to mobile design pass.
- **`HistoricalTimeline`** — Becomes horizontally scrollable with snap. Current Era band scrolls into view on lesson change.
- **`MobileLessonDrawer`** — On web this is a slide-in side panel. On native mobile, either a side-drawer (matches prototype, reinforces parity) or a bottom-sheet (more native to iOS/Android conventions). **Default: side-drawer**, revisit after first user test.
- **`Flourish`** — Centered glyph with hairlines, slightly smaller font weight on mobile.
- **`TopBar`** — Hides title on scroll-down, restores on scroll-up. Tiny progress chip moves to a sticky sub-bar inside the reader on mobile width.
- **`MarkAsCompletedButton`** — On the lesson reader, becomes a sticky bottom CTA when the user scrolls past 60% of the body.
- **`PreviousNextLessonNavigation`** — Two side-by-side cards become a single full-width primary action (next) plus a smaller link (prev) at narrow widths; full prev/next pair restored at iPad widths.

---

## 9. Fonts

- **Spectral**, **Inter**, **JetBrains Mono** bundled via `expo-font`.
- Pre-load critical weights (Spectral 400/500, Inter 500, Mono 400) before initial render.
- Fall back to system serif / sans / mono while loading; no FOIT.

---

## 10. Offline strategy

The full course content ships inside the app bundle. Everything works offline by default. No network is required for any v1 feature.

Implications:

- App bundle includes all 365 lessons (as TS-compiled JS or, post-MDX-migration, as precompiled JSON).
- Estimated content payload: ≤ 1.5 MB compressed. Acceptable for App Store and Play Store binary size limits.
- Future cloud-sync feature can layer on without changing the offline-first foundation.

---

## 11. Native UX touches (future opportunities)

Not in v1, listed so the architecture stays open to them:

- **Daily reminder notification** — "Day 32 is ready." Schedules locally; no backend.
- **Haptic on completion** — `expo-haptics` light tap when marking complete.
- **Pull-to-refresh** on Course overview — refreshes progress (no-op on local-only build, but readable behavior).
- **Pinch-to-zoom or text-size respect** — honors system text size setting.
- **Reading session tracking (private)** — counts minutes per session locally; visible in a future "Streak" view.

---

## 12. Splash, icon, app metadata

- App icon: the brand "i" circular mark, full-bleed adaptation per platform.
- Splash: cream background + serif "Istorija365" wordmark, centered.
- Store name (English): "History 365: Serbian History"
- Store name (Serbian): "Istorija 365: Istorija Srbije"
- Tagline: "365 dana kroz istoriju Srbije"
- Category: Education
- Age rating: 4+ (no UGC, no third-party links, educational text only)
- Privacy: no data collection in v1. Privacy label declarations reflect this honestly.

---

## 13. Testing

- **Unit**: Jest + React Native Testing Library for `ui-mobile` components.
- **Flow**: Maestro flows for `open Home → open course → open Day 1 → complete → restart app → progress persists`.
- **Device matrix**: iOS Simulator (iPhone 14, 16), Pixel 6 emulator, plus one real device per platform before submission.
- **Visual regression**: deferred — RN visual testing tooling is less mature; rely on hand review per release in v1.

---

## 14. Build & deploy

- `eas build --platform ios` and `eas build --platform android` for store binaries.
- `eas update` for OTA non-native patches.
- CI builds preview iOS and Android binaries on every mobile-touching PR.

---

## 15. Open mobile decisions (resolve at mobile phase kickoff)

- [ ] Minimum iOS / Android versions.
- [ ] Drawer vs bottom-sheet for the lesson outline on mobile.
- [ ] Dropcap rendering strategy on RN.
- [ ] Native daily-reminder notification scope for v1 mobile, or defer to v2.
- [ ] Whether to bundle a Cyrillic-script variant (deferred unless the script toggle ships).
- [ ] Analytics on mobile (deferred unless explicitly requested by product).
