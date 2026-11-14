import { CalendarDate, parseDate, toCalendarDate } from "@internationalized/date";
import { TFile, TFolder } from "obsidian";
import { setAdapter } from "persian-holidays";
import DatePicker from "src/components/DatePicker";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import NoteService from "src/services/NoteService";
import Placeholder from "src/services/Placeholder";
import SmartDateLinker from "src/services/SmartDateLinker";
import GridService from "src/templates/CalendarView/CalendarRenderer/CalendarBody/GridService";
import CalendarState from "src/templates/CalendarView/CalendarState";
import { createSettingChangeHandler } from "src/templates/Setting/settingEffects";
import type { TSetting, TWeekCalculationMode } from "src/types";
import { dateToDash } from "src/utils/dashUtils";
import {
	calendarDateFromDate,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	dateToWeekdayName,
	getWeekdayTehran,
	getWeekStartCalculator,
	gregorianToCalendarDate,
	jalaliToCalendarDate,
	nowTehran,
	todayTehran,
} from "src/utils/dateUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

const modes: TWeekCalculationMode[] = [
	"jalali-first-day-of-year",
	"jalali-first-week-start",
	"gregorian-first-day-of-year",
	"gregorian-first-week-start",
];

function makePlugin(overrides: Partial<TSetting> = {}) {
	const files = new Map<string, TFile | TFolder>();
	const contents = new Map<string, string>();
	const template = Object.assign(new TFile(), { path: "template.md", basename: "template" });
	files.set(template.path, template);
	contents.set(template.path, "{{تاریخ میلادی یادداشت}} | {{هفته یادداشت}}");
	const plugin = {
		setting: { ...DEFAULT_SETTING, ...overrides },
		app: {
			vault: {
				getAbstractFileByPath: (path: string) => files.get(path) ?? null,
				createFolder: vi.fn(async (path: string) => {
					const folder = Object.assign(new TFolder(), { path });
					files.set(path, folder);
					return folder;
				}),
				create: vi.fn(async (path: string, content: string) => {
					const file = Object.assign(new TFile(), {
						path,
						basename: path.split("/").pop()?.replace(/\.md$/, ""),
					});
					files.set(path, file);
					contents.set(path, content);
					return file;
				}),
				read: async (file: TFile) => contents.get(file.path) ?? "",
				modify: vi.fn(async (file: TFile, content: string) => {
					contents.set(file.path, content);
				}),
			},
			workspace: {
				getActiveFile: () => null,
				getLeavesOfType: () => [],
				getActiveViewOfType: () => null,
				getMostRecentLeaf: () => ({ openFile: vi.fn().mockResolvedValue(undefined) }),
			},
		},
		saveSetting: vi.fn().mockResolvedValue(undefined),
		refreshViews: vi.fn(),
	} as unknown as PersianCalendarPlugin;
	plugin.noteService = new NoteService(plugin.app, plugin);
	return plugin;
}

beforeAll(() => setAdapter(setDefaultEventAdapter()));
afterEach(() => vi.useRealTimers());

describe("Tehran calendar interpretation", () => {
	it.each([
		["2025-03-20T20:29:59Z", 2025, 3, 20],
		["2025-03-20T20:30:00Z", 2025, 3, 21],
		["2021-07-01T20:00:00Z", 2021, 7, 2],
		["2025-07-01T20:00:00Z", 2025, 7, 1],
	])("interprets %s using IANA historical timezone rules", (iso, gy, gm, gd) => {
		const instant = new Date(iso);
		const timestamp = instant.getTime();
		const interpreted = calendarDateFromDate(instant);
		const calendarDate = gregorianToCalendarDate(gy, gm, gd);
		expect(dateToGregorian(interpreted)).toEqual({ gy, gm, gd });
		expect(dateToJalali(interpreted)).toEqual(dateToJalali(calendarDate));
		expect(dateToHijri(interpreted)).toEqual(dateToHijri(calendarDate));
		expect(getWeekdayTehran(interpreted)).toBe(getWeekdayTehran(calendarDate));
		expect(dateToWeekdayName(interpreted)).toBe(dateToWeekdayName(calendarDate));
		expect(instant.getTime()).toBe(timestamp);
	});

	it("keeps the current timestamp and resolves today at Tehran midnight", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-03-20T20:30:00Z"));
		expect(nowTehran().toDate().getTime()).toBe(Date.now());
		expect(todayTehran().toString()).toBe("2025-03-21");
		expect(dateToJalali(todayTehran())).toEqual({ jy: 1404, jm: 1, jd: 1 });
		const plugin = makePlugin();
		const placeholders = new Placeholder(plugin);
		expect(
			placeholders.processPlaceholders(
				Object.assign(new TFile(), { path: "undated.md", basename: "undated" }),
				"{{تاریخ میلادی جاری}}",
			),
		).toBe("2025-03-21");
		expect(new SmartDateLinker(plugin).formatSmartDate("امروز", todayTehran(), "fa", false)).toBe(
			"2025-03-21",
		);
	});

	it("uses ZonedDateTime across historical DST and CalendarDate for day math", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2021-03-21T15:00:00Z"));
		const instant = nowTehran();
		const added = instant.add({ days: 1 });
		expect(instant.toDate().toISOString()).toBe("2021-03-21T15:00:00.000Z");
		expect(added.toDate().toISOString()).toBe("2021-03-22T14:00:00.000Z");
		expect(toCalendarDate(added).toString()).toBe("2021-03-22");
		expect(todayTehran().add({ days: 1 }).toString()).toBe("2021-03-22");
	});

	it("initializes the picker, rendered grid and periodic paths from the same Tehran day", () => {
		const plugin = makePlugin();
		const picker = new DatePicker(plugin.app, plugin.setting, "2025-03-21", () => {});
		expect((picker as unknown as { currentJalali: unknown }).currentJalali).toMatchObject({
			year: 1404,
			month: 1,
			day: 1,
		});
		const state = new CalendarState({ jYear: 1404, jMonth: 1 });
		expect(state.calculateFirstDayOfWeekIndex(1404, 1)).toBe(6);
		const first = new GridService(state, plugin.setting)
			.buildMonthGrid(1404, 1)
			.find((cell) => cell.isInCurrentMonth);
		expect(first?.gregorian).toEqual({ gy: 2025, gm: 3, gd: 21 });
		const paths = new NotePathBuilder(plugin);
		expect(paths.buildDailyNotePath(1404, 1, 1).filePath).toBe("Journal/1404/Daily/2025-03-21.md");
		expect(paths.buildMonthlyNotePath(1404, 1).filePath).toBe("Journal/1404/Monthly/1404-01.md");
		expect(paths.buildSeasonalNotePath(1404, 1).filePath).toBe("Journal/1404/Seasonal/1404-S1.md");
		expect(paths.buildYearlyNotePath(1404).filePath).toBe("Journal/1404/1404.md");
	});
});

// Columns follow modes above; year-end W1 retains the date's calendar year.
const boundaries = [
	["2024-12-27", ["1403-W41", "1403-W40", "2024-W52", "2024-W51"]],
	["2024-12-28", ["1403-W42", "1403-W41", "2024-W01", "2024-W52"]],
	["2024-12-31", ["1403-W42", "1403-W41", "2024-W01", "2024-W52"]],
	["2025-01-01", ["1403-W42", "1403-W41", "2025-W01", "2024-W52"]],
	["2025-01-04", ["1403-W43", "1403-W42", "2025-W02", "2025-W01"]],
	["2025-03-19", ["1403-W01", "1403-W52", "2025-W12", "2025-W11"]],
	["2025-03-20", ["1403-W01", "1403-W52", "2025-W12", "2025-W11"]],
	["2025-03-21", ["1404-W01", "1403-W52", "2025-W12", "2025-W11"]],
	["2025-03-22", ["1404-W02", "1404-W01", "2025-W13", "2025-W12"]],
] as const;

describe.each(modes)("shared week identity: %s", (mode) => {
	it.each(boundaries)("uses the established boundary identity on %s", (iso, expected) => {
		const date = parseDate(iso);
		const result = getWeekStartCalculator(mode).getWeekNumber(date);
		expect(`${result.jy}-W${String(result.weekNumber).padStart(2, "0")}`).toBe(
			expected[modes.indexOf(mode)],
		);
		// The same Tehran day begins on the preceding UTC evening.
		const evening = new Date(Date.parse(`${iso}T12:00:00Z`) - 15 * 60 * 60 * 1000);
		expect(getWeekStartCalculator(mode).getWeekNumber(calendarDateFromDate(evening))).toEqual(
			result,
		);
	});

	it("agrees across paths, mentions, calendar rows and daily/weekly placeholders", () => {
		const plugin = makePlugin({ weekCalculation: mode, dailyNotesPath: "jYYYY/[W]ww" });
		const paths = new NotePathBuilder(plugin);
		const placeholders = new Placeholder(plugin);
		const linker = new SmartDateLinker(plugin);
		const date = jalaliToCalendarDate(1403, 12, 30);
		const { jy, weekNumber } = getWeekStartCalculator(mode).getWeekNumber(date);
		const id = `${jy}-W${String(weekNumber).padStart(2, "0")}`;
		const daily = paths.buildDailyNotePath(1403, 12, 30);
		expect(daily.filePath).toBe(`1403/W${String(weekNumber).padStart(2, "0")}/2025-03-20.md`);
		const weekly = paths.buildWeeklyNotePath(jy, weekNumber);
		expect(weekly.fileName).toBe(`${id}.md`);
		expect(linker.formatSmartDate("این هفته", date, "fa", false)).toBe(id);
		expect(linker.formatSmartDate("این هفته", date)).toBe(
			`[[${weekly.filePath.slice(0, -3)}|این هفته]]`,
		);
		const map = placeholders.getPlaceholderMap({
			currentDate: date,
			fileDate: date,
			fileName: "2025-03-20",
			baseDate: "gregorian",
		});
		expect(map.get("{{هفته جاری}}")).toBe(id);
		expect(map.get("{{هفته یادداشت}}")).toBe(id);
		const weeklyMap = placeholders.getPlaceholderMap({
			currentDate: date,
			fileDate: null,
			fileName: id,
			baseDate: "gregorian",
		});
		expect(weeklyMap.get("{{هفته یادداشت}}")).toBe(id);
		expect(weeklyMap.get("{{اول هفته}}")).toBe(map.get("{{اول هفته}}"));
		expect(weeklyMap.get("{{آخر هفته}}")).toBe(map.get("{{آخر هفته}}"));
		const state = new CalendarState({ jYear: 1403, jMonth: 12 });
		expect(state.getWeekNumbersForMonth(1403, 12, mode).at(-1)).toEqual({ jy, weekNumber });
		plugin.setting.dailyNoteFormat = "YYYY-MM-DD-[W]ww";
		expect(paths.buildDailyNoteFileName(1403, 12, 30)).toBe(
			`2025-03-20-W${String(weekNumber).padStart(2, "0")}`,
		);
	});
});

it("reads week-mode changes without reconstructing consumers", async () => {
	const plugin = makePlugin({ dailyNotesPath: "jYYYY/[W]ww" });
	const paths = new NotePathBuilder(plugin);
	const linker = new SmartDateLinker(plugin);
	const placeholders = new Placeholder(plugin);
	const apply = createSettingChangeHandler(plugin, () => {});
	const date = jalaliToCalendarDate(1403, 12, 30);
	for (const mode of modes) {
		await apply("weekCalculation", mode);
		const expected = boundaries[6][1][modes.indexOf(mode)];
		expect(linker.formatSmartDate("این هفته", date, "fa", false)).toBe(expected);
		const week = Number(expected.split("W")[1]);
		expect(paths.buildDailyNotePath(1403, 12, 30).filePath).toContain(
			`/W${String(week).padStart(2, "0")}/`,
		);
		expect(
			placeholders.processPlaceholders(
				Object.assign(new TFile(), { path: "2025-03-20.md", basename: "2025-03-20" }),
				"{{هفته یادداشت}}",
			),
		).toBe(expected);
	}
	expect(plugin.saveSetting).toHaveBeenCalledTimes(4);
	expect(dateToDash(date, "gregorian")).toBe("2025-03-20");
});

it.each([
	["2025-03-20T20:29:59Z", "2025-03-20", 1403, 12, 30],
	["2025-03-20T20:30:00Z", "2025-03-21", 1404, 1, 1],
	["2024-12-31T20:29:59Z", "2024-12-31", 1403, 10, 11],
	["2024-12-31T20:30:00Z", "2025-01-01", 1403, 10, 12],
	["2021-03-21T20:29:59Z", "2021-03-21", 1400, 1, 1],
	["2021-03-21T20:30:00Z", "2021-03-22", 1400, 1, 2],
] as const)(
	"creates daily notes and resolves the UI at Tehran boundary %s",
	async (instant, expected, jy, jm, jd) => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(instant));
		const date = todayTehran();
		expect(date).toBeInstanceOf(CalendarDate);
		expect(date.toString()).toBe(expected);
		expect(dateToJalali(date)).toEqual({ jy, jm, jd });
		const plugin = makePlugin({ askForCreateNote: false, dailyTemplatePath: "template.md" });
		plugin.placeholder = new Placeholder(plugin);
		await plugin.noteService.openOrCreateDailyNote(jy, jm, jd);
		const path = `Journal/${jy}/Daily/${expected}.md`;
		expect(plugin.app.vault.create).toHaveBeenCalledExactlyOnceWith(path, "");
		const file = plugin.app.vault.getAbstractFileByPath(path) as TFile;
		const id = new SmartDateLinker(plugin).formatSmartDate("این هفته", date, "fa", false);
		expect(await plugin.app.vault.read(file)).toBe(`${expected} | ${id}`);
		expect(plugin.placeholder.resolveNoteDate(file)).toBeInstanceOf(CalendarDate);
		expect(new SmartDateLinker(plugin).formatSmartDate("امروز", date)).toBe(
			`[[${path.slice(0, -3)}|امروز]]`,
		);
		expect(new SmartDateLinker(plugin).formatSmartDate("فردا", date, "fa", false)).toBe(
			date.add({ days: 1 }).toString(),
		);
		expect(new SmartDateLinker(plugin).formatSmartDate("دیروز", date, "fa", false)).toBe(
			date.subtract({ days: 1 }).toString(),
		);
		const picker = new DatePicker(plugin.app, plugin.setting, null, () => {});
		expect((picker as unknown as { currentJalali: CalendarDate }).currentJalali).toBeInstanceOf(
			CalendarDate,
		);
		expect((picker as unknown as { currentJalali: CalendarDate }).currentJalali).toMatchObject({
			year: jy,
			month: jm,
			day: jd,
		});
		const state = new CalendarState();
		expect(state.getJState()).toEqual({ jYearState: jy, jMonthState: jm });
		const todayCell = new GridService(state, plugin.setting)
			.buildMonthGrid(jy, jm)
			.filter((cell) => cell.isToday);
		expect(todayCell).toHaveLength(1);
		expect(todayCell[0].date).toBeInstanceOf(CalendarDate);
		expect(todayCell[0].date.toString()).toBe(expected);
	},
);

it.each([
	["1403-12-30", "year", 1, 1404, 12, 29],
	["1404-06-31", "month", 1, 1404, 7, 30],
	["1403-12-30", "month", 1, 1404, 1, 30],
] as const)(
	"navigates DatePicker from %s by %s using calendar constraints",
	(initial, unit, delta, year, month, day) => {
		const plugin = makePlugin();
		const picker = new DatePicker(plugin.app, plugin.setting, initial, () => {});
		const view = picker as unknown as {
			currentJalali: CalendarDate;
			render: () => void;
			shiftYear: (delta: number) => void;
			shiftMonth: (delta: number) => void;
		};
		view.render = vi.fn();
		const original = view.currentJalali;
		if (unit === "year") view.shiftYear(delta);
		else view.shiftMonth(delta);
		expect(view.currentJalali).toBeInstanceOf(CalendarDate);
		expect(view.currentJalali).toMatchObject({ year, month, day });
		expect(view.currentJalali).not.toBe(original);
		expect(view.render).toHaveBeenCalledOnce();
	},
);
