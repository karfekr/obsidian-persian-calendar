# Development, Testing & Release Workflow

This document covers tooling, code style rules, the Vitest test suite, checklists for common changes, and the PR/release process.

## 1. Build & Dev Scripts

| Command                | Implementation                                                                             | What It Does                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run dev`         | `esbuild.config.mjs` + `scripts/build-styles.mjs --watch`                                  | Runs incremental JS watch build (inline sourcemaps, keeps `console`) and CSS watch build.                                                                 |
| `pnpm run build`       | `clean` -> `build:style` -> `esbuild.config.mjs production` -> `tsc -noEmit -skipLibCheck` | Cleans root artifacts, builds minified `styles.css`, builds minified `main.js` (drops `console` & `debugger`, no sourcemaps), and type-checks with `tsc`. |
| `pnpm run build:style` | `scripts/build-styles.mjs`                                                                 | Resolves relative `@import`s from `src/styles/index.css` and minifies into `styles.css` via PostCSS + `cssnano`.                                          |
| `pnpm run lint`        | `biome check --write .`                                                                    | Formats, organizes imports, and lints all files (except `scripts/**` which has linter disabled in `biome.json`).                                          |
| `pnpm run test`        | `vitest`                                                                                   | Runs Vitest in watch mode. Use `pnpm run test -- run` for a single non-interactive pass.                                                                  |
| `pnpm run version`     | `scripts/sync-version.mjs && pnpm run lint`                                                | Syncs version metadata across `manifest.json`, `versions.json`, and `package.json`, then runs Biome.                                                      |

### `esbuild.config.mjs` Externals

Obsidian provides `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, and Node built-ins at runtime. They are marked `external` in `esbuild.config.mjs` and must not be bundled.

---

## 2. Code Style & Linter Rules (`biome.json` & `tsconfig.json`)

Do **not** modify `biome.json` or `.editorconfig` conventions. Key enforced rules:

- **Formatting:** Tabs (`indentWidth: 2`), LF line endings, line width `100`, double quotes, semicolons always, trailing commas `all`, arrow parens `always`.
- **Imports:** Auto-organized by Biome; `useImportType` with `style: "separatedType"` + `tsconfig.json` `verbatimModuleSyntax: true` means type-only imports **must** use separate `import type { ... }` statements.
- **Strictness:**
  - `noExplicitAny: "error"`
  - `noUnusedVariables: "error"`
  - `noDoubleEquals: "error"` (always use `===` / `!==`)
  - `noConsole: "warn"` (production builds also strip `console.*` via esbuild `drop`)
  - TypeScript `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`.
- **Path aliases:** Use `src/...` (configured in both `tsconfig.json` and `vitest.config.ts`) or relative imports consistently with surrounding files.
- **Git hooks (`simple-git-hooks`):**
  - `pre-commit`: `pnpm run lint`
  - `pre-push`: `pnpm run build && pnpm run test` (note: `pnpm run test` runs Vitest; in CI/non-interactive shells pass `-- run` when invoking manually).

---

## 3. Testing (`tests/`)

Vitest runs in a `node` environment (`vitest.config.ts`) with `globals: true` and two aliases:

- `src` -> `./src`
- `obsidian` -> `./tests/__mocks__/obsidian.ts`

### Obsidian Mock (`tests/__mocks__/obsidian.ts`)

Provides lightweight stubs for `TAbstractFile`, `TFile`, `TFolder`, `MarkdownView`, `MarkdownRenderChild`, `EditorSuggest`, `editorLivePreviewField`, `editorInfoField`, `View`, `Plugin`, `PluginSettingTab`, `Setting`, `Modal`, `Notice`, `setIcon`, `debounce`, `Platform`, and `normalizePath`.

If a new test imports an Obsidian API symbol not yet mocked, add a minimal, faithful stub to `tests/__mocks__/obsidian.ts`.

### Current Test Suite Map

| Directory / File                                | Coverage                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tests/dateEngine/*.test.ts`                    | Tokenizer, registry, compiler, formatter, parser, validator, weekly anchors, backward compatibility, edge cases. |
| `tests/dateUtils/*.test.ts`                     | Jalali, Gregorian, Hijri (`iran` & `umalqura`), and Tehran week calculations.                                    |
| `tests/dashUtils/weekPlaceholders.test.ts`      | Dash-formatted week placeholders.                                                                                |
| `tests/services/notePathBuilder.test.ts`        | Daily/weekly/monthly/seasonal/yearly path building, `"bracketed"` vs `"standard"` modes, Gregorian naming.       |
| `tests/services/noteDeletion.test.ts`           | Periodic note deletion & confirmation flows.                                                                     |
| `tests/services/placeholder.test.ts`            | Static `{{...}}` placeholder resolution and note date detection.                                                 |
| `tests/services/liveExpression.test.ts`         | Live expressions, countdowns, cadence timers, settings refresh, Reading View & Live Preview behavior.            |
| `tests/services/settingsMigration.test.ts`      | Legacy path, v4->v5 bracket inversion, `dailyNoteFormat`, and `weekendDays` migrations.                          |
| `tests/services/apiTimezone.test.ts`            | `ApiService` timezone boundary guarantees across timezones.                                                      |
| `tests/services/weeklyNoteFormatting.test.ts`   | Weekly note naming and legacy unpadded fallback.                                                                 |
| `tests/calendarView/calendarNavigation.test.ts` | Calendar navigation state transitions.                                                                           |
| `tests/eventUtils.test.ts`                      | Holiday/event merging, categories, deduplication.                                                                |
| `tests/vaultEventUtils.test.ts`                 | Pipe-delimited vault event note parsing, frontmatter stripping, leap-year recurring dates.                       |

---

## 4. Checklists for Common Changes

### Adding a New Setting

1. Add the property to `TSetting` (and `TBoolSettingKeys` if boolean) in `src/types/index.ts`.
2. Add its default value to `DEFAULT_SETTING` in `src/constants/setting/index.ts`.
3. Add migration logic in `src/services/SettingsMigration/index.ts` if existing users need transformation.
4. Register its side effect in `SETTING_EFFECTS` (`src/templates/Setting/settingEffects.ts`) — and in `LIVE_EXPRESSION_SETTING_KEYS` (`src/services/LiveExpression/index.ts`) if it affects live expressions.
5. Add the UI control in the appropriate `src/templates/Setting/sections/*.ts` file.
6. Add localized labels/descriptions to **both** `src/languages/local/en.json` and `src/languages/local/fa.json`.
7. Add/update unit tests (e.g., `tests/services/settingsMigration.test.ts`).

### Adding a New Date Engine Token

1. Define the token in `src/utils/dateEngine/tokens/` (`gregorianTokens.ts`, `jalaliTokens.ts`, or `weekTokens.ts`) and add it to `TToken` in `src/types/index.ts`.
2. Ensure `NotePathBuilder.buildEngineContext()` supplies the corresponding `TDateEngineContext` field.
3. Add tests in `tests/dateEngine/` covering tokenization, formatting, parsing, validation, and edge cases.

### Adding a New Live Expression (`{+...}`)

1. Add the entry to `canonicalExpressions` in `src/services/LiveExpression/registry.ts` with the right `cadence` (`"day"` default, `"minute"`, or `"second"`).
2. Respect `context.outputLanguage` for localized text (numeral conversion is handled automatically by `LiveExpression.calculateValue`).
3. Add unit tests in `tests/services/liveExpression.test.ts`.

### Adding a New Command

1. Register it in `src/services/CommandRegistry/index.ts`.
2. Add command titles to both `en.json` and `fa.json`.

---

## 5. Git, PR & Release Workflow

- **Branching:** Create topic branches from `upstream/dev` (e.g., `feat/...`, `fix/...`, `docs/...`).
- **Pull Requests:** Open PRs against `dev` on `karfekr/obsidian-persian-calendar`.
- **Verification before PR:**

  ```bash
  pnpm run lint
  pnpm run build
  pnpm run test -- run
  ```
- **Releases (maintainers):**
  - Release notes live in `src/constants/releaseNotes/` and are extracted during CI by `scripts/get-release-notes.ts`.
  - Pushing a git tag triggers `.github/workflows/release.yml`, which installs with `pnpm install --frozen-lockfile`, runs `pnpm run build`, generates build provenance attestations, and publishes a GitHub Release with `main.js`, `manifest.json`, and `styles.css`.
