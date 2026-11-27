# AGENTS.md — Obsidian Persian Calendar

This file is the primary guide for AI coding agents working on `obsidian-persian-calendar`. Keep changes minimal, well-tested, and aligned with the project's architecture and conventions.

For deeper context, consult the modular agent documentation in [`docs/`](docs/README.md).

## Project Overview

**Obsidian Persian Calendar** (`id: persian-calendar`, GPL-3.0, v5.0.0) is a cross-platform (desktop & mobile) Obsidian community plugin integrating the **Persian (Solar Hijri / Jalali)** calendar alongside **Gregorian** and **Lunar Hijri** (`iran` estehlal & `umalqura`) calendars.

Core capabilities:

- **Sidebar Calendar View** (`persian-calendar`) with Jalali grid, optional Gregorian/Hijri sub-dates, Iranian holidays, custom vault events, active daily note sync, and context menus (open in tab/split, delete periodic notes).
- **Dynamic Periodic Notes** (daily, weekly, monthly, seasonal, yearly) with a custom token-based **Date Engine**, configurable week calculation modes, and template application.
- **Editor Integrations** via a unified `EditorSuggest` (`Suggestion`):
  - `@` / `@/` smart date links (`SmartDateLinker`)
  - `{{...}}` static template placeholders (`Placeholder`)
  - `{+...}` live-updating expressions and countdowns in Reading View & Live Preview (`LiveExpression`)
- **Jalali DatePicker** injected into Obsidian date properties via `MutationObserver` and available via command.
- **Public Plugin API** exposed on `plugin.api` (`ApiService`).

## Tech Stack & Tooling

| Area                 | Tool / Library                                                 | Notes                                                                                   |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Package manager      | `pnpm` (`12.18.0`)                                             | Pinned via `packageManager`; always use `pnpm`, never `npm`/`yarn`.                     |
| Language             | TypeScript `^7.0.2`                                            | Strict mode + `verbatimModuleSyntax: true`; path alias `src/*`.                         |
| Bundler              | `esbuild` (`0.28.2`)                                           | Bundles `src/main.ts` -> `main.js` (CJS, `es2022`). Drops `console`/`debugger` in prod. |
| Styles               | PostCSS + `cssnano`                                            | `scripts/build-styles.mjs` bundles `src/styles/index.css` -> `styles.css`.              |
| Platform             | Obsidian API `^1.14.4`                                         | `minAppVersion: 1.13.1`, `isDesktopOnly: false`.                                        |
| Runtime deps         | `@internationalized/date`, `iran-estehlal`, `persian-holidays` | **Minimal dependency policy**: do not add runtime deps without maintainer approval.     |
| Linting / Formatting | Biome (`@biomejs/biome`)                                       | Config in `biome.json` + `.editorconfig`. Do not alter formatting rules.                |
| Testing              | Vitest `^5.1.0`                                                | Node environment with mocked `obsidian` module (`tests/__mocks__/obsidian.ts`).         |
| Git Hooks            | `simple-git-hooks`                                             | `pre-commit`: `pnpm run lint`; `pre-push`: `pnpm run build && pnpm run test`.           |

## Essential Commands

```bash
pnpm install              # Install dependencies
pnpm run dev              # Watch JS (esbuild) and CSS (build-styles.mjs --watch)
pnpm run build            # Clean, build styles.css, production bundle main.js, and tsc --noEmit
pnpm run build:style      # Compile src/styles/index.css -> styles.css only
pnpm run test             # Run Vitest in watch mode
pnpm run test -- run      # Run Vitest once (CI / agent verification)
pnpm run lint             # Format and lint with Biome (biome check --write .)
pnpm run version          # Sync version across manifest.json / versions.json / package.json + lint
```

## Repository Map

```text
.
├── AGENTS.md                 # You are here (agent entry point)
├── docs/                     # Detailed architecture & subsystem guides for AI agents
├── manifest.json             # Obsidian plugin manifest (id, version, minAppVersion)
├── versions.json             # Plugin version -> minAppVersion map
├── package.json              # Scripts, dependencies, simple-git-hooks
├── biome.json                # Biome formatter & linter rules
├── tsconfig.json             # TypeScript compiler config (src/* alias, strict)
├── esbuild.config.mjs        # JS bundle config -> main.js
├── vitest.config.ts          # Vitest config + obsidian mock alias
├── scripts/                  # Build, clean, CSS bundling, version sync, release notes
├── src/
│   ├── main.ts               # PersianCalendarPlugin entry point & lifecycle
│   ├── components/           # Modals & UI widgets (DatePicker, ConfirmModal, UpdateModal, VaultEventModal, Notice, SocialLinks)
│   ├── constants/            # Default settings, date names, regexes, colors, release notes, social links
│   ├── languages/            # i18n runtime (t, setLocal, getDirection, onLocalChange) + en.json / fa.json
│   ├── services/             # Core business logic & Obsidian integrations
│   ├── styles/               # Modular CSS (index.css + sections/*.css)
│   ├── templates/            # CalendarView/ and Setting/ UI modules
│   ├── types/                # Shared TypeScript types (src/types/index.ts)
│   └── utils/                # Pure utilities: dateEngine/, dateUtils/, dashUtils/, eventUtils/, vaultEventUtils/, formatters/, release/
└── tests/                    # Vitest unit tests + tests/__mocks__/obsidian.ts
```

## Critical Invariants & Gotchas

1. **Never hand-edit build outputs:** `main.js` and `styles.css` at the repo root are generated artifacts. Edit `src/` and `src/styles/` and run `pnpm run build` (or `pnpm run build:style`).
2. **Always use `CalendarDate` & `Asia/Tehran` time:** Avoid raw JS `Date` math for calendar logic. Use `todayTehran()`, `nowTehran()`, and `CalendarDate` from `@internationalized/date` via `src/utils/dateUtils/tehran.ts`.
3. **Two Date Engine pattern modes (v5):**
   - **Folder paths** (`dailyNotesPath`, `weeklyNotesPath`, etc.) use `"bracketed"` mode: plain text is literal, tokens must be inside `[...]` (e.g., `Journal/[jYYYY]/Daily`).
   - **Filenames** (`dailyNoteFormat`) use `"standard"` mode: tokens are evaluated directly, and literals are escaped inside `[...]` (e.g., `jYYYY-[S]jQ`).
4. **Settings migrations:** Persisted settings in `data.json` are normalized on load by `applySettingsMigrations()` (`src/services/SettingsMigration/index.ts`). Any new setting must have a default in `src/constants/setting/index.ts` and a side-effect entry in `src/templates/Setting/settingEffects.ts` if it needs debounced/special refresh behavior.
5. **Bilingual & RTL/LTR parity:** Every UI string must be added to both `src/languages/local/en.json` and `src/languages/local/fa.json`. Calendar, modals, context menus, and settings dynamically switch `dir` between `rtl` (`fa`) and `ltr` (`en`).
6. **Strict Biome & TS rules:** Tabs for indentation, double quotes, semicolons, `import type` separated (`useImportType: separatedType`), no `any` (`noExplicitAny: error`), no `==` (`noDoubleEquals: error`), no unused variables, `noConsole: warn`.
7. **Target branch for PRs:** Feature and documentation PRs target the `dev` branch on `karfekr/obsidian-persian-calendar` (not `main`).
8. **Verify before finishing:** Always run `pnpm run lint`, `pnpm run build`, and `pnpm run test -- run` before committing or opening a PR.

## Documentation Index

Read the relevant guide in `docs/` before modifying a subsystem:

| Document                                                             | Read when working on...                                                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/README.md`](docs/README.md)                                   | Routing index & quick reference across all agent docs                                                                                  |
| [`docs/architecture.md`](docs/architecture.md)                       | Plugin lifecycle, module boundaries, data flow, public `plugin.api`                                                                    |
| [`docs/date-engine.md`](docs/date-engine.md)                         | Calendar conversions, Tehran timezone, week calculators, Date Engine tokens/parsing/validation, path migrations                        |
| [`docs/services-and-flows.md`](docs/services-and-flows.md)           | Periodic notes, templates & `{{}}` placeholders, `@` SmartDateLinker, `{+}` Live Expressions, holidays & vault custom events, commands |
| [`docs/ui-and-styles.md`](docs/ui-and-styles.md)                     | Sidebar `CalendarView`, Settings tab & `settingEffects`, modals/`DatePicker`, i18n/RTL, CSS pipeline                                   |
| [`docs/development-and-testing.md`](docs/development-and-testing.md) | Build scripts, Biome/TS rules, Vitest & Obsidian mocks, checklists for common changes, release workflow                                |
| [`src/utils/README.md`](src/utils/README.md)                         | Existing reference for low-level utility functions in `src/utils/`                                                                     |
