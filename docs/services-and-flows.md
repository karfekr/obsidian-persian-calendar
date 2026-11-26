# Services & Core Flows

This document explains how each service in `src/services/` works and how data flows across them.

## 1. Periodic Notes (`NotePathBuilder` & `NoteService`)

### `NotePathBuilder` (`src/services/NotePathBuilder/`)

Builds full vault paths for all five periodic note types using `formatPattern` (`"bracketed"` for folder paths, `"standard"` for filenames):

| Note Type | Folder Setting      | Filename Rule                                                                                                                |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Daily     | `dailyNotesPath`    | `dailyNoteFormat` (default `YYYY-MM-DD`) + `.md`                                                                             |
| Weekly    | `weeklyNotesPath`   | `toWeekFormat(jy, weekNumber)` (e.g. `1404-W05.md`); anchored to week start via `getWeekStartCalculator`                     |
| Monthly   | `monthlyNotesPath`  | `jYYYY-jMM.md` (if `monthlyNoteNaming === "jalali"`) or `YYYY-MM.md` via `mapJalaliMonthToGregorianLabel` (if `"gregorian"`) |
| Seasonal  | `seasonalNotesPath` | `jYYYY-[S]jQ.md` (e.g. `1404-S1.md`)                                                                                         |
| Yearly    | `yearlyNotesPath`   | `jYYYY.md` (if `yearlyNoteNaming === "jalali"`) or `YYYY.md` via `mapJalaliYearToGregorianLabel` (if `"gregorian"`)          |

`buildEngineContext(parts)` automatically fills derived fields (`gy/gm/gd` <-> `jy/jm/jd`, `season`, `quarter`, `dow`) so folder paths can freely mix Jalali and Gregorian tokens.

### `NoteService` (`src/services/NoteService/index.ts`)

Owns all vault I/O for periodic notes:

- **Detection (`getDailyNoteDate(file)`):** Builds a detection pattern via `pathBuilder.buildDetectionPattern()`, parses `file.path`, resolves a unique Jalali date (even if the pattern only has partial fields, via `searchMatchingDate` within ±2 years), and round-trip verifies that `buildDailyNotePath` reproduces `file.path`.
- **Legacy weekly fallback (`getWeeklyNoteFile`):** Checks padded `YYYY-W05.md` first, then falls back to unpadded `YYYY-W5.md` for weeks 1–9 without renaming existing notes.
- **Open or Create (`openOrCreate*Note`):**
  1. If the file exists, opens it in `current`, `tab`, `split-horizontal`, or `split-vertical` (`TOpenNoteMode`).
  2. If missing and `setting.askForCreateNote` is true, prompts with `createNoteModal`.
  3. Recursively creates parent folders (`ensureFolderExistsForPath`), creates the `.md` file, applies the configured template via `plugin.placeholder.getTemplateContent()`, opens the file, and calls `plugin.refreshViews()`.
- **Delete (`delete*Note`):** Supports deleting daily, weekly, monthly, seasonal, and yearly notes via `app.fileManager.trashFile(file)` (prompting with `ConfirmModal` when `setting.askForDeleteNote` is true), then refreshes views.
- **Presence indicators:** `getDaysWithNotes`, `getWeeksWithNotes`, `getSeasonsWithNotes`, `getMonthlyNoteFile`, `getYearlyNoteFile` drive the dot indicators in `CalendarView`.

---

## 2. Static Placeholders (`Placeholder`)

`src/services/Placeholder/index.ts` handles static `{{...}}` template placeholders:

- **When triggered:**
  - During periodic note creation (`getTemplateContent(templatePath, targetFile)`).
  - Automatically on vault `create` (after 300ms delay once layout is ready) and `modify` (if `Date.now() - file.stat.ctime < 2000`) via `EventManager`.
  - Manually via the `replace-persian-placeholders` command.
  - Autocompleted in the editor via `toProvider()` (trigger: `/\{\{[^}]*$/`).
- **Date resolution cascade (`resolveNoteDate(file)`):**
  1. `noteService.getDailyNoteDate(file)` (full path pattern match)
  2. `parsePattern(detectionPattern, file.path)`
  3. `parsePattern(dailyNoteFormat, file.basename)`
  4. Regex fallback on `file.basename` (`YYYY-MM-DD` / `YYYY/MM/DD` / `YYYY.MM.DD`, distinguishing Gregorian 1800–2200 vs Jalali 1200–1700)
  5. `dashToCalendarDate(file.basename, setting.dateFormat)`
- **Categories of placeholders:** Current date (`جاری`), note date (`یادداشت`), days passed/remaining in year/season/month, start/end of week/month/season/year, and daily events (`مناسبت جاری` / `مناسبت یادداشت`).

---

## 3. Unified Editor Autocomplete (`Suggestion` & `SmartDateLinker`)

`Suggestion` (`src/services/Suggestion/index.ts`) extends Obsidian's `EditorSuggest<string>` and delegates to an ordered list of `TSuggestProvider`s registered in `src/main.ts`:

1. **`SmartDateLinker` (`@` and `@/`):**
   - Trigger: `/@\/?[^@\s]*$/`
   - Suggests Persian relative keywords from `SMART_DATE_LINKS` (e.g., `امروز`, `فردا`, `دیروز`, `شنبه`, `دوشنبه بعد`, `این هفته`, `ماه قبل`, `فصل بعد`, `امسال`).
   - `@keyword` inserts a wiki-link (`[[path|label]]`); `@/keyword` inserts a plain date/period string without brackets.
2. **`Placeholder` (`{{`):**
   - Trigger: `/\{\{[^}]*$/`
   - Inserts `{{...}}` placeholder keys.
3. **`LiveExpression` (`{+`):**
   - Trigger: `/(?<!\{)\{\+[^}]*$/`
   - Inserts `{+...}` live expression keys (rendered with `<bdi dir="ltr">` in the popup for clean RTL/LTR display).

`Suggestion.selectSuggestion()` also consumes trailing auto-closed `}` or `}}` characters so users don't end up with duplicate closing braces.

---

## 4. Live Expressions (`src/services/LiveExpression/`)

Live Expressions render dynamic, auto-updating Persian/English calendar values and countdowns inline using `{+keyword}` syntax **without modifying the underlying Markdown file**.

### Sub-modules

- **`index.ts` (`LiveExpression`):**
  - Central cadence-based pub/sub scheduler with three buckets: `"second"` (1s interval), `"minute"` (aligned to the next Tehran minute boundary, then 60s interval), and `"day"` (timeout scheduled for the next Tehran midnight + 100ms).
  - Timers are **lazy**: a cadence timer only runs while at least one subscriber exists, and stops immediately when the last subscriber unsubscribes.
  - Registers `document.visibilitychange` and `window.focus` resume listeners (debounced to 100ms) so values and timers re-sync immediately after laptop sleep or tab switching.
  - Applies numeral formatting (`liveExpressionNumeralLanguage`: `"fa"` | `"en"`) in `calculateValue(key)`.
  - **`handlePostProcess(element, context)`:** Reading View `MarkdownPostProcessor` that walks text nodes (skipping `CODE`, `PRE`, `SCRIPT`, `STYLE`, `TEXTAREA`, `INPUT`, and already-rendered `.persian-live-expression` spans), replaces matches with `<span class="persian-live-expression">`, and registers a `LiveExpressionRenderChild` (`MarkdownRenderChild`) so subscriptions auto-clean when the view unloads.
- **`livePreviewExtension.ts`:**
  - CodeMirror 6 `ViewPlugin` active only when `editorLivePreviewField` is true.
  - Scans visible ranges, skips fenced code blocks (` ``` ` / `~~~`), inline code spans, and any expression whose range intersects the current cursor/selection (so moving the cursor onto `{+...}` reveals raw source for editing).
  - Replaces non-selected expressions with `LiveExpressionWidget` (`Decoration.replace`), subscribing on `toDOM()` and cleaning up via `WeakMap` in `destroy()`.
- **`registry.ts`:**
  - `ExpressionContext` lazily computes `now` (`nowTehran()`), `date`, `jalali`, `hijri`, `weekday`, `weekNumber`, `season`, progress stats, `events`, `outputLanguage`, and `isHoliday`.
  - `canonicalExpressions` defines all static keys (time, Jalali/Gregorian/Hijri parts, calendar calculations, elapsed percentages, events, holiday status).
  - `findExpression(key)` checks `canonicalExpressions` first, then falls back to `parseCountdown(key)`.
- **`countdown.ts`:**
  - Parses `{+YYYY-MM-DD}`, `{+MM-DD}`, `{+YYYY-MM-DD HH:MM}`, `{+YYYY-MM-DD HH:MM:SS}`, and recurring `{+MM-DD HH:MM[:SS]}` Jalali targets in `Asia/Tehran` at `"second"` cadence.
  - Yearless countdowns automatically target the next future occurrence (handling leap years like `12-30`).
- **Settings reactivity:** `isLiveExpressionSetting(key)` identifies settings that affect rendered values; `settingEffects.ts` and `VaultEventService.refresh()` call `plugin.liveExpression.refresh()` when any of them change.

---

## 5. Holidays & Vault Custom Events

### Built-in & Merged Events (`src/utils/eventUtils/`)

- `eventAdapter/index.ts` bridges `persian-holidays` with `iran-estehlal` (default Iranian Hijri base) and `umalqura` (optional Sunni/UmAlQura adapter).
- `dateToEvents(date, option)` queries `persian-holidays` across Jalali, Hijri, and Gregorian calendars for enabled categories (`government`, `historical`, `ancient`, `shia`, `sunni`, `international`), merges matching `TCustomEvent` items, and deduplicates by `${id}-${isHolidayInIran}`.
- `checkHoliday(date, option)` returns true if any event (including custom events when enabled) has `isHolidayInIran: true`.

### Vault-Driven Custom Events (`VaultEventService` & `vaultEventUtils`)

Users define custom events in Markdown notes configured via `setting.vaultEventSources` (`TVaultEventSource[]`, each with `{ id, path, calendar, enabled }`):

- **Line format (`src/utils/vaultEventUtils/index.ts`):** Strips YAML frontmatter, then parses pipe-delimited lines:

  ```text
  YYYY-MM-DD | Title | optional-color | optional-تعطیل
  MM-DD | Recurring Title | optional-color | optional-تعطیل
  ```

  Valid colors are checked via `isCustomEventColor` (`src/constants/customEventColors/`). Invalid lines are silently ignored.
- **Caching & race protection (`src/services/VaultEventService/index.ts`):** `refresh()` reads all enabled source notes with `vault.cachedRead`, guards against stale concurrent refreshes using an incrementing `refreshVersion`, updates `cachedEvents`, and triggers `liveExpression.refresh()`.
- **Rename tracking (`moveSources`):** When a source note or its parent folder is renamed/moved in Obsidian, `EventManager` calls `vaultEventService.moveSources()` and persists updated paths to `data.json`.

---

## 6. Vault Event Manager, Commands & Version Checker

- **`EventManager` (`src/services/EventManager/index.ts`):**
  - Listens to `vault.on("create" | "modify" | "delete" | "rename")` for `.md` files and folders.
  - Waits 3 seconds after `onLayoutReady` (`isLayoutReady`) before auto-running `placeholder.insertPersianDate` on newly created files so vault startup indexing doesn't modify existing notes.
  - Debounces calendar view refreshes (`50ms`) and vault event refreshes (`150ms`).
- **`CommandRegistry` (`src/services/CommandRegistry/index.ts`):**
  - Registers 9 commands: open calendar, replace placeholders, open today/tomorrow/yesterday daily note, open weekly/seasonal/monthly/yearly note, and insert date via `DatePicker`.
  - Subscribes to `onLocalChange` to reload command titles when language changes.
- **`VersionChecker` (`src/services/VersionChecker/index.ts`):**
  - Compares `manifest.version` against `setting.lastSeenVersion`.
  - Dynamically imports `src/utils/release` and `UpdateModal` only when a release note exists for the new version and `setting.versionUpdate` is enabled.
