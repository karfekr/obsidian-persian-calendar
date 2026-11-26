# AI Agent Documentation — Obsidian Persian Calendar

This directory contains structured, code-grounded reference documentation designed for AI coding agents and contributors working on `obsidian-persian-calendar`.

Start with [`AGENTS.md`](../AGENTS.md) for quick commands and invariants, then use the routing table below to load only the context you need.

## Documentation Map

| Guide                                                      | Scope                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`architecture.md`](architecture.md)                       | System overview, startup/teardown lifecycle, dependency graph, module boundaries, and public `plugin.api`.                                                                                                    |
| [`date-engine.md`](date-engine.md)                         | `Asia/Tehran` timezone rules, Jalali/Gregorian/Hijri utilities, week calculation modes, Date Engine pipeline & token reference, `"standard"` vs `"bracketed"` modes, and `SettingsMigration`.                 |
| [`services-and-flows.md`](services-and-flows.md)           | `NotePathBuilder`, `NoteService`, `Placeholder` (`{{}}`), `SmartDateLinker` (`@`/`@/`), `Suggestion`, `LiveExpression` (`{+}`), `EventManager`, `VaultEventService`, `CommandRegistry`, and `VersionChecker`. |
| [`ui-and-styles.md`](ui-and-styles.md)                     | `CalendarView` architecture, `CalendarSettingTab` & `settingEffects`, UI components (`DatePicker`, modals), i18n (`en`/`fa`, RTL/LTR), and the CSS build pipeline.                                            |
| [`development-and-testing.md`](development-and-testing.md) | Local dev/build scripts, Biome & TypeScript strictness, Vitest & `tests/__mocks__/obsidian.ts`, step-by-step checklists for common tasks, and PR/release workflow.                                            |

## Task-to-Doc Routing

- **Adding or modifying a date token or folder/filename format** -> [`date-engine.md`](date-engine.md) + [`services-and-flows.md`](services-and-flows.md) (`NotePathBuilder`)
- **Changing periodic note creation, deletion, or templates** -> [`services-and-flows.md`](services-and-flows.md) (`NoteService`, `Placeholder`)
- **Adding a live expression (`{+...}`) or countdown feature** -> [`services-and-flows.md`](services-and-flows.md) (`LiveExpression`)
- **Changing calendar UI, tooltips, context menus, or CSS** -> [`ui-and-styles.md`](ui-and-styles.md)
- **Adding a new plugin setting** -> [`ui-and-styles.md`](ui-and-styles.md) (`Settings`) + [`development-and-testing.md`](development-and-testing.md) (Checklists)
- **Working on Iranian holidays or vault-based custom events** -> [`services-and-flows.md`](services-and-flows.md) (`VaultEventService`, `eventUtils`)
- **Writing tests or fixing lint/build issues** -> [`development-and-testing.md`](development-and-testing.md)
- **Looking up individual helper functions in `src/utils/`** -> [`src/utils/README.md`](../src/utils/README.md)
