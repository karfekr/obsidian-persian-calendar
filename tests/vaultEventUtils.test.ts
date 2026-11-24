import type { TAbstractFile } from "obsidian";
import { TFile, TFolder } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import EventManager from "src/services/EventManager";
import VaultEventService from "src/services/VaultEventService";
import { createSettingChangeHandler } from "src/templates/Setting/settingEffects";
import type { TDateFormat, TVaultEventSource } from "src/types";
import { parseRecurringDate, parseVaultEventsNote } from "src/utils/vaultEventUtils";

const source: TVaultEventSource = {
	id: "family",
	path: "Events/Family.md",
	calendar: "jalali",
	enabled: true,
};

describe("parseRecurringDate", () => {
	it("defaults to Jalali regardless of the year", () => {
		expect(parseRecurringDate("2025-12-01")).toEqual({
			calendar: "jalali",
			month: 12,
			day: 1,
			originYear: 2025,
		});
	});

	it.each<TDateFormat>(["jalali", "gregorian", "hijri"])(
		"honors the selected %s calendar for the same year",
		(calendar) => {
			expect(parseRecurringDate("1405-12-01", calendar)).toEqual({
				calendar,
				month: 12,
				day: 1,
				originYear: 1405,
			});
		},
	);

	it("accepts only ASCII MM-DD and YYYY-MM-DD dates", () => {
		expect(parseRecurringDate("12-30")).toEqual({ calendar: "jalali", month: 12, day: 30 });
		expect(parseRecurringDate("2024-02-29", "gregorian")).toMatchObject({
			calendar: "gregorian",
			month: 2,
			day: 29,
			originYear: 2024,
		});

		for (const date of ["12-3", "12/03", "12.03", "2024/12/03", "١٢-٠٣", "۱۲-۰۳"]) {
			expect(parseRecurringDate(date)).toBeNull();
		}
	});

	it("rejects invalid dates within the selected calendar", () => {
		expect(parseRecurringDate("1402-12-30")).toBeNull();
		expect(parseRecurringDate("2025-02-29", "gregorian")).toBeNull();
		expect(parseRecurringDate("02-30", "gregorian")).toBeNull();
		expect(parseRecurringDate("09-31", "hijri")).toBeNull();
		expect(parseRecurringDate("0000-12-01")).toBeNull();
	});

	it("validates full-date month endings in the specified year and Hijri base", () => {
		expect(parseRecurringDate("1399-12-30", "jalali")).toMatchObject({ originYear: 1399, day: 30 });
		expect(parseRecurringDate("2024-02-29", "gregorian")).toMatchObject({
			originYear: 2024,
			day: 29,
		});
		expect(parseRecurringDate("2100-02-29", "gregorian")).toBeNull();
		expect(parseRecurringDate("1446-08-30", "hijri", "iran")).toMatchObject({
			originYear: 1446,
			day: 30,
		});
		expect(parseRecurringDate("1446-08-30", "hijri", "umalqura")).toBeNull();
	});
});

describe("parseVaultEventsNote", () => {
	it("parses plain pipe-separated events after frontmatter", () => {
		const events = parseVaultEventsNote(
			`---
dates: |
  06-12 | Ignore metadata
---
12-01 | تولد ۲۵ سالگی مش رجب
12-02 | تولد مش رضا | | تعطیل
`,
			source,
		);

		expect(events).toEqual([
			{
				id: "vault:family:line:0",
				title: "تولد ۲۵ سالگی مش رجب",
				month: 12,
				day: 1,
				calendar: "jalali",
				enabled: true,
				isHoliday: false,
			},
			expect.objectContaining({ title: "تولد مش رضا", month: 12, day: 2, isHoliday: true }),
		]);
	});

	it.each([
		["", undefined, false],
		["| red", "red", false],
		["| orange", "orange", false],
		["| yellow", "yellow", false],
		["| green | تعطیل", "green", true],
		["| cyan", "cyan", false],
		["| blue", "blue", false],
		["| purple |", "purple", false],
		["| pink", "pink", false],
		["| | تعطیل", undefined, true],
		["| |", undefined, false],
	])("parses optional fields %j independently of the title", (fields, color, isHoliday) => {
		const events = parseVaultEventsNote(`12-03 | جشن شرکت ${fields}`, source);
		expect(events.map((event) => [event.title, event.color, event.isHoliday])).toEqual([
			["جشن شرکت", color, isHoliday],
		]);
	});

	it.each<TDateFormat>(["jalali", "gregorian", "hijri"])(
		"uses the repository's %s calendar",
		(calendar) => {
			const events = parseVaultEventsNote("1405-05-12 | Event", { ...source, calendar });
			expect(events).toMatchObject([{ calendar, originYear: 1405, month: 5, day: 12 }]);
		},
	);

	it("rejects malformed lines without reinterpreting fields", () => {
		const content = `1402-12-32 | Invalid month day
13-01 | Invalid month
04-31 | Invalid month length
12-00 | Invalid day
2025-02-29 | Invalid Gregorian leap day
02-12 nonsense | Invalid date field
08-12 |   | green | تعطیل
08-13 |
12-03 | Holiday in color position | تعطیل
12-03 | Invalid color | brown
12-03 | Invalid holiday | green | تعطیلی
12-03 Invalid legacy event
- 12-03 | Markdown list event
08-14 | Too many fields | blue | تعطیل | extra
 | Missing date | blue | تعطیل
Just text
12-03 | Valid | | تعطیل`;
		const gregorian = { ...source, calendar: "gregorian" } as const;
		expect(parseVaultEventsNote(content, gregorian).map((event) => event.title)).toEqual(["Valid"]);
		expect(parseVaultEventsNote(content, { ...source, enabled: false })).toEqual([]);
	});
});

describe("vault event repositories", () => {
	it("caches independent notes and reacts to edits, moves, deletion, creation and settings", async () => {
		const family = Object.assign(new TFile(), { path: source.path });
		const work = Object.assign(new TFile(), { path: "Work.md" });
		const observances = Object.assign(new TFile(), { path: "Observances.md" });
		const files = new Map([family, work, observances].map((file) => [file.path, file]));
		const content = new Map([
			[family, "12-25 | Family"],
			[work, "12-25 | Office | orange | تعطیل"],
			[observances, "09-01 | Ramadan\n1446-08-30 | End of Sha'ban"],
		]);
		const settings = {
			...DEFAULT_SETTING,
			vaultEventSources: [
				source,
				{ ...source, id: "work", path: "Work", calendar: "gregorian" },
				{ ...source, id: "observances", path: observances.path, calendar: "hijri", enabled: false },
			] satisfies TVaultEventSource[],
		};
		const listeners = new Map<string, (file: TAbstractFile, oldPath?: string) => unknown>();
		const plugin = {
			setting: settings,
			liveExpression: { refresh: vi.fn() },
			app: {
				vault: {
					on: (name: string, callback: (file: TAbstractFile, oldPath?: string) => unknown) =>
						listeners.set(name, callback),
					getFileByPath: (path: string) => files.get(path),
					cachedRead: vi.fn(async (file: TFile) => content.get(file)),
				},
				workspace: { onLayoutReady: vi.fn() },
			},
			registerEvent: vi.fn(),
			saveSetting: vi.fn(),
			refreshCalendarViews: vi.fn(),
			refreshViews: vi.fn(),
		};
		const mockPlugin = plugin as unknown as PersianCalendarPlugin;
		const service = new VaultEventService(mockPlugin);
		mockPlugin.vaultEventService = service;
		new EventManager(mockPlugin).registerEvents();

		await service.refresh();
		const ids = service.getEvents().map((event) => event.id);
		expect(ids).toEqual(["vault:family:line:0", "vault:work:line:0"]);
		expect(service.getEvents().map((event) => event.calendar)).toEqual(["jalali", "gregorian"]);
		expect(service.getEvents()[1]).toMatchObject({ color: "orange", isHoliday: true });
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(2);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledOnce();

		content.set(family, "12-25 | Updated family | blue");
		await listeners.get("modify")?.(family);
		await vi.waitFor(() =>
			expect(service.getEvents()[0]).toMatchObject({ title: "Updated family", color: "blue" }),
		);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(2);

		const folder = new TFolder();
		folder.path = "Calendar";
		content.set(family, "12-25 | Moved family");
		files.delete(family.path);
		family.path = "Calendar/Family.md";
		files.set(family.path, family);
		await listeners.get("rename")?.(folder, "Events");
		await vi.waitFor(() => expect(service.getEvents()[0].title).toBe("Moved family"));
		expect(service.getEvents().map((event) => event.id)).toEqual(ids);
		expect(settings.vaultEventSources[0].path).toBe(family.path);
		expect(plugin.saveSetting).toHaveBeenCalledOnce();

		files.delete(family.path);
		listeners.get("delete")?.(family);
		await vi.waitFor(() => expect(service.getEvents().map((event) => event.id)).toEqual([ids[1]]));
		files.set(family.path, family);
		listeners.get("create")?.(family);
		await vi.waitFor(() => expect(service.getEvents().map((event) => event.id)).toEqual(ids));

		const applySetting = createSettingChangeHandler(mockPlugin, vi.fn());
		const repositories = settings.vaultEventSources;
		const reads = plugin.app.vault.cachedRead.mock.calls.length;
		await applySetting("showCustomEvents", false);
		expect(service.getEvents()).toEqual([]);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(6);
		await applySetting("showCustomEvents", true);
		expect(service.getEvents().map((event) => event.id)).toEqual(ids);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(7);
		expect(settings.vaultEventSources).toBe(repositories);
		expect(repositories.map((entry) => entry.enabled)).toEqual([true, true, false]);
		expect(plugin.app.vault.cachedRead).toHaveBeenCalledTimes(reads);

		await applySetting(
			"vaultEventSources",
			settings.vaultEventSources.map((entry) => ({
				...entry,
				enabled: entry.calendar === "hijri",
			})),
		);
		expect(service.getEvents().map((event) => event.title)).toEqual(["Ramadan", "End of Sha'ban"]);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(8);
		await applySetting("hijriBase", "umalqura");
		expect(service.getEvents().map((event) => event.title)).toEqual(["Ramadan"]);
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(9);
		await applySetting("liveExpressionOutputLanguage", "en");
		await applySetting("liveExpressionNumeralLanguage", "fa");
		expect(plugin.liveExpression.refresh).toHaveBeenCalledTimes(11);
	});
});
