# UI, Settings, Localization & Styles

This document covers the sidebar `CalendarView`, Settings tab, reusable components, localization system, and CSS build pipeline.

## 1. Sidebar Calendar View (`src/templates/CalendarView/`)

`CalendarView` (`src/templates/CalendarView/index.ts`) extends Obsidian's `View` with view type `"persian-calendar"` and icon `"calendar-heart"`.

### Sub-module Responsibilities

| Module                                       | Responsibility                                                                                                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CalendarView/index.ts`                      | View lifecycle (`onOpen`, `onClose`), 60s midnight rollover check (`startDailyCheckInterval`), and workspace sync (`active-leaf-change` / `file-open`) that highlights and jumps to the currently open daily note.                         |
| `CalendarState/index.ts`                     | Holds displayed `{ jYearState, jMonthState }` and `activeJDate`, plus month grid math (`calculateFirstDayOfWeekIndex`, `calculateDaysFromPreviousMonth`, `calculateDaysFromNextMonth`, `getWeeksCountForMonth`, `getWeekNumbersForMonth`). |
| `CalendarRenderer/index.ts`                  | Orchestrates full re-renders of `containerEl` (`dir` set to `rtl`/`ltr`), wrapping header, seasonal notes row, and body in `safeRender()` error boundaries.                                                                                |
| `CalendarRenderer/renderErrorBoundary.ts`    | `safeRender(container, section, fn)` catches render exceptions per section so one broken panel doesn't blank the entire view.                                                                                                              |
| `CalendarRenderer/CalendarNavigation/`       | Month/year stepping (`prevMonth`, `nextMonth`, `goToToday`, etc.) that mutates `CalendarState` and triggers re-render.                                                                                                                     |
| `CalendarRenderer/CalendarHeader/`           | Top bar: month/year display (clickable for monthly/yearly notes + context menus), navigation buttons, and optional "Go to current" button (`showGoToCurrent`).                                                                             |
| `CalendarRenderer/CalendarBody/`             | Renders the optional seasonal notes row (`showSeasonalNotes`), weekday headers, week number column, and day cells with note-existence dots, holiday/weekend styling, custom event color markers, and hover tooltips.                       |
| `CalendarRenderer/CalendarBody/GridService/` | Builds the `TMonthGridCell[]` array (Jalali + Gregorian + Hijri dates, `isToday`, `isWeekend`, `isHolidayInIran`).                                                                                                                         |
| `CalendarRenderer/CalendarBody/Tooltip/`     | Renders localized event/holiday tooltips for hovered/focused day cells.                                                                                                                                                                    |
| `CalendarRenderer/noteContextMenu.ts`        | Shared right-click `Menu` (`setUseNativeMenu(false)`, RTL/LTR aware) offering: Open in new tab, Open in horizontal split, Open in vertical split, and (when a note exists) Delete note.                                                    |

---

## 2. Settings Tab (`src/templates/Setting/`)

`CalendarSettingTab` (`src/templates/Setting/index.ts`) uses Obsidian's declarative `getSettingDefinitions(): SettingDefinitionItem[]` API (searchable settings) with `getControlValue(key)` and `setControlValue(key, value)`.

### Sections (`src/templates/Setting/sections/`)

1. `GeneralSection.ts` — language, live expression numeral/output languages, startup daily note, confirm create/delete modals, seasonal row, go-to-current button, version update modal.
2. `PathSection.ts` — folder paths for daily, weekly, monthly, seasonal, yearly notes (v5 `"bracketed"` pattern syntax).
3. `NameSection.ts` — `dailyNoteFormat` (`"standard"` pattern syntax), `dateFormat`, `weekCalculation`, `monthlyNoteNaming`, `yearlyNoteNaming`.
4. `TemplateSection.ts` — template file paths for each periodic note type.
5. `ExtraCalendarSection.ts` — show Gregorian/Hijri sub-dates, `hijriBase` (`iran` vs `umalqura`).
6. `HolidaySection.ts` — `showHolidays` toggle and per-weekday `weekendDays` toggles (`weekendDays.friday`, etc., accessed via dot-path helpers `getNestedValue` / `setNestedValue`).
7. `EventSection.ts` — built-in event category toggles (`showIROfficialEvents`, etc.), `showCustomEvents`, and CRUD UI for `vaultEventSources` (using `VaultEventModal`).

### Setting Side Effects (`src/templates/Setting/settingEffects.ts`)

`createSettingChangeHandler(plugin, onLocaleChange)` centralizes persistence and refreshes:

- **`"refresh-debounced"` (400ms):** Used for text inputs (`*NotesPath`, `*TemplatePath`, `dailyNoteFormat`) to avoid disk writes and calendar re-renders on every keystroke.
- **`"refresh-immediate"`:** Saves immediately and refreshes calendar views.
- **`"language"`:** Calls `setLocal()`, saves, refreshes views, and re-renders the settings tab.
- **Cascading refreshes:**
  - Changing `vaultEventSources` or `hijriBase` awaits `plugin.vaultEventService.refresh()` alongside `saveSetting()`.
  - Changing `liveExpressionNumeralLanguage` or `liveExpressionOutputLanguage` refreshes `liveExpression` immediately before saving.
  - Changing any other `isLiveExpressionSetting(key)` refreshes `liveExpression` after saving.

---

## 3. Reusable Components (`src/components/`)

| Component          | Purpose                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DatePicker/`      | Interactive Jalali calendar modal. Triggered either by the `insert-date-picker` command or by the `calendar-heart` button injected into Obsidian's `.metadata-property-value[data-property-type="date"]` inputs via `MutationObserver` in `src/main.ts`. Dispatches synthetic `InputEvent("input")` and `Event("change")` so Obsidian commits the selected date. |
| `ConfirmModal/`    | `createNoteModal(app, { title, message }): Promise<boolean>` used for both note creation and note deletion confirmations.                                                                                                                                                                                                                                        |
| `UpdateModal/`     | Displays bilingual release notes from `src/constants/releaseNotes/` when `VersionChecker` detects an upgrade.                                                                                                                                                                                                                                                    |
| `VaultEventModal/` | Modal for adding/editing a `TVaultEventSource` (path + calendar type) in `EventSection`.                                                                                                                                                                                                                                                                         |
| `Notice/`          | Thin wrapper around Obsidian's `Notice` with optional `rtl`/`ltr` direction support.                                                                                                                                                                                                                                                                             |
| `SocialLinks/`     | Renders project links (from `src/constants/socialLinks/`) in the settings banner.                                                                                                                                                                                                                                                                                |

---

## 4. Localization (`src/languages/`)

- `src/languages/local/en.json` and `src/languages/local/fa.json` store nested translation keys.
- `t(key)` resolves dot-separated paths in the active locale (`currentLocal`), falling back to `en`, then returning the raw `key` if missing.
- `getDirection()` returns `"rtl"` for `"fa"` and `"ltr"` for `"en"`.
- `onLocalChange(cb, immediate?)` registers reactive listeners (used by `CommandRegistry`, `CalendarSettingTab`, and injected `DatePicker` button tooltips) and returns an unsubscribe function.
- **Rule:** Always add new keys to **both** `en.json` and `fa.json` with identical key structure.

---

## 5. Styling & CSS Pipeline (`src/styles/`)

Source CSS is modularized under `src/styles/` and compiled into root `styles.css` by `scripts/build-styles.mjs` (PostCSS + `cssnano`).

### Import Order (`src/styles/index.css`)

Import order matters (noted by `/*! ترتیب مهمه */` at the top of `index.css`):

1. `sections/base.css` — CSS custom properties and base resets
2. Templates: `header.css`, `calendar.css`, `day.css`, `tooltip.css`, `setting.css`
3. Components: `social-links.css`, `update.css`, `confirm-modal.css`, `date-picker.css`
4. `sections/responsive.css` — responsive overrides (must stay last)

### CSS Rules for Agents

- Namespace classes under `.persian-calendar` / `.persian-calendar__*` (and `.persian-live-expression` for live expressions) to avoid leaking styles into Obsidian's UI.
- Only relative `@import` paths inside the project root are supported by `scripts/build-styles.mjs`.
- Support both RTL and LTR layouts (prefer CSS logical properties like `margin-inline-start`, `text-align: start`, or `[dir="rtl"]` selectors).
- Never hand-edit root `styles.css`; run `pnpm run build:style` or `pnpm run build` to regenerate it.
