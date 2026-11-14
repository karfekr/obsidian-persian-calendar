import type { App, TAbstractFile } from "obsidian";
import { TFile, TFolder } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import NoteService from "src/services/NoteService";
import Placeholder from "src/services/Placeholder";
import SmartDateLinker from "src/services/SmartDateLinker";
import CalendarBodyRender from "src/templates/CalendarView/CalendarRenderer/CalendarBody";
import type CalendarNavigation from "src/templates/CalendarView/CalendarRenderer/CalendarNavigation";
import CalendarState from "src/templates/CalendarView/CalendarState";
import type { TWeekCalculationMode } from "src/types";
import { dashToJWeekDash } from "src/utils/dashUtils";
import { formatPattern } from "src/utils/dateEngine";
import {
	getWeekStartCalculator,
	gregorianToCalendarDate,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";
import { toWeekFormat } from "src/utils/formatters";

const modes: TWeekCalculationMode[] = [
	"jalali-first-day-of-year",
	"jalali-first-week-start",
	"gregorian-first-day-of-year",
	"gregorian-first-week-start",
];

function harness(mode: TWeekCalculationMode, weeklyNotesPath = "[Weekly]/[W]ww") {
	const files = new Map<string, TAbstractFile>();
	const contents = new Map<string, string>();
	const addFile = (path: string, content = "") => {
		const file = Object.assign(new TFile(), {
			path,
			basename: path.split("/").pop()?.replace(/\.md$/, "") ?? "",
		});
		files.set(path, file);
		contents.set(path, content);
		return file;
	};
	const openFile = vi.fn().mockResolvedValue(undefined);
	const vault = {
		getAbstractFileByPath: (path: string) => files.get(path) ?? null,
		createFolder: vi.fn(async (path: string) => {
			const folder = Object.assign(new TFolder(), { path });
			files.set(path, folder);
			return folder;
		}),
		create: vi.fn(async (path: string, content: string) => {
			if (files.has(path)) throw new Error("File already exists");
			return addFile(path, content);
		}),
		read: async (file: TFile) => contents.get(file.path) ?? "",
		modify: vi.fn(async (file: TFile, content: string) => {
			contents.set(file.path, content);
		}),
	};
	const app = {
		vault,
		workspace: {
			getLeavesOfType: () => [],
			getActiveViewOfType: () => null,
			getActiveFile: () => null,
			getMostRecentLeaf: () => ({ openFile }),
		},
	} as unknown as App;
	const plugin = {
		app,
		setting: {
			...DEFAULT_SETTING,
			askForCreateNote: false,
			weekCalculation: mode,
			weeklyNotesPath,
			weeklyTemplatePath: "Templates/weekly.md",
		},
		refreshViews: vi.fn(),
	} as unknown as PersianCalendarPlugin;
	plugin.noteService = new NoteService(app, plugin);
	plugin.placeholder = new Placeholder(plugin);
	addFile("Templates/weekly.md", "Week: {{هفته یادداشت}}");
	return { plugin, vault, files, contents, addFile, openFile };
}

beforeAll(() => setAdapter(setDefaultEventAdapter()));

describe.each(modes)("weekly note formatting: %s", (mode) => {
	const year = mode.startsWith("jalali") ? 1403 : 2025;

	it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 52, 53])(
		"creates and reopens week %i using padded filenames, paths and template identifiers",
		async (week) => {
			const { plugin, vault, contents, openFile } = harness(mode);
			const digits = String(week).padStart(2, "0");
			const path = `Weekly/W${digits}/${year}-W${digits}.md`;
			await plugin.noteService.openOrCreateWeeklyNote(year, week);
			expect(vault.create).toHaveBeenCalledExactlyOnceWith(path, "");
			expect(vault.createFolder).toHaveBeenCalledWith(`Weekly/W${digits}`);
			expect(openFile).toHaveBeenCalledWith(expect.objectContaining({ path }), { active: true });
			expect(contents.get(path)).toBe(`Week: ${year}-W${digits}`);
			expect(plugin.noteService.getWeeksWithNotes(year)).toEqual([week]);
			await plugin.noteService.openOrCreateWeeklyNote(year, week);
			expect(vault.create).toHaveBeenCalledTimes(1);
			expect(vault.modify).toHaveBeenCalledTimes(1);
		},
	);

	it("reuses unpadded existing notes and links without renaming or creating duplicates", async () => {
		const { plugin, vault, files, contents, addFile, openFile } = harness(mode);
		const path = `Weekly/W01/${year}-W1.md`;
		addFile(path, "Existing content");
		await plugin.noteService.openOrCreateWeeklyNote(year, 1);
		expect(vault.create).not.toHaveBeenCalled();
		expect(vault.modify).not.toHaveBeenCalled();
		expect(vault.createFolder).not.toHaveBeenCalled();
		expect(openFile).toHaveBeenCalledWith(expect.objectContaining({ path }), { active: true });
		expect(contents.get(path)).toBe("Existing content");
		expect(files.has(`Weekly/W01/${year}-W01.md`)).toBe(false);
		expect(plugin.noteService.getWeeksWithNotes(year)).toEqual([1]);
		expect(
			plugin.placeholder.processPlaceholders(files.get(path) as TFile, "{{هفته یادداشت}}"),
		).toBe(`${year}-W01`);
		const calculator = getWeekStartCalculator(mode);
		const start = calculator.getStartOfWeek(year, 1);
		const date = mode.endsWith("first-day-of-year")
			? mode.startsWith("jalali")
				? jalaliToCalendarDate(year, 1, 1)
				: gregorianToCalendarDate(year, 1, 1)
			: jalaliToCalendarDate(start.jy, start.jm, start.jd);
		const linker = new SmartDateLinker(plugin);
		expect(linker.formatSmartDate("این هفته", date)).toBe(`[[${path.slice(0, -3)}|این هفته]]`);
		expect(linker.formatSmartDate("این هفته", date, "fa", false)).toBe(`${year}-W01`);
	});

	it("prefers the padded note when both filenames already exist", async () => {
		const { plugin, addFile, openFile, vault } = harness(mode);
		addFile(`Weekly/W01/${year}-W1.md`, "Old");
		const padded = addFile(`Weekly/W01/${year}-W01.md`, "Padded");
		await plugin.noteService.openOrCreateWeeklyNote(year, 1);
		expect(openFile).toHaveBeenCalledWith(padded, { active: true });
		expect(vault.create).not.toHaveBeenCalled();
		expect(vault.modify).not.toHaveBeenCalled();
	});

	it("preserves custom literals, separators and explicit unpadded w tokens", async () => {
		const { plugin, vault } = harness(mode, "[Custom]/[week-]w/[padded-]ww");
		await plugin.noteService.openOrCreateWeeklyNote(year, 2);
		expect(vault.create).toHaveBeenCalledWith(`Custom/week-2/padded-02/${year}-W02.md`, "");
		expect(formatPattern("[week:]w[ / ]ww", { week: 2 })).toBe("week:2 / 02");
	});
});

it.each([
	["jalali-first-day-of-year", [1403, 12, 30], 1403, 1, "Journal/1402/Weekly/1403-W01.md"],
	["jalali-first-week-start", [1404, 1, 1], 1403, 52, "Journal/1403/Weekly/1403-W52.md"],
	["jalali-first-week-start", [1404, 1, 2], 1404, 1, "Journal/1404/Weekly/1404-W01.md"],
	["gregorian-first-day-of-year", [1403, 10, 11], 2024, 1, "Journal/1402/Weekly/2024-W01.md"],
	["gregorian-first-day-of-year", [1403, 10, 12], 2025, 1, "Journal/1403/Weekly/2025-W01.md"],
	["gregorian-first-week-start", [1403, 10, 12], 2024, 52, "Journal/1403/Weekly/2024-W52.md"],
	["gregorian-first-week-start", [1403, 10, 15], 2025, 1, "Journal/1403/Weekly/2025-W01.md"],
] as const)(
	"preserves year-boundary creation in %s on %j",
	async (mode, parts, year, week, path) => {
		const { plugin, vault } = harness(mode, DEFAULT_SETTING.weeklyNotesPath);
		const date = jalaliToCalendarDate(parts[0], parts[1], parts[2]);
		expect(getWeekStartCalculator(mode).getWeekNumber(date)).toEqual({
			jy: year,
			weekNumber: week,
		});
		await plugin.noteService.openOrCreateWeeklyNote(year, week);
		expect(vault.create).toHaveBeenCalledExactlyOnceWith(path, "");
		plugin.setting.dailyNotesPath = "jYYYY/[W]ww";
		if (mode === "jalali-first-day-of-year") {
			expect(
				new NotePathBuilder(plugin).buildDailyNotePath(parts[0], parts[1], parts[2]).filePath,
			).toBe("1403/W01/2025-03-20.md");
		}
	},
);

it("normalizes legacy week identifiers without changing separators or numeric week semantics", () => {
	for (const week of [1, 9, 10, 53]) {
		expect(toWeekFormat(1403, week, { separator: "/" })).toBe(
			`1403/W${String(week).padStart(2, "0")}`,
		);
		expect(dashToJWeekDash(`1403-W${week}`)).toBe(`1403-W${String(week).padStart(2, "0")}`);
	}
});

it.each(modes)("renders two-digit calendar labels in %s", (mode) => {
	const { plugin } = harness(mode);
	const state = new CalendarState({ jYear: 1404, jMonth: 1 });
	const labels: string[] = [];
	const node = {
		querySelector: () => null,
		style: { setProperty: () => {} },
		addClass: () => {},
		addEventListener: () => {},
		createDiv: (options: { cls: string; text?: string }) => {
			if (options.cls === "persian-calendar__week-number") labels.push(options.text ?? "");
			return node;
		},
	} as unknown as HTMLElement;
	const renderer = new CalendarBodyRender(
		state,
		plugin.noteService,
		plugin.setting,
		() => {},
		{} as CalendarNavigation,
	);
	// biome-ignore lint/complexity/useLiteralKeys: Isolate the private week renderer without changing its production API.
	renderer["renderWeekNumbers"](node, { jy: 1404, jm: 1 });
	const expected = [
		["۰۱", "۰۲"],
		["۵۲", "۰۱"],
		["۱۲", "۱۳"],
		["۱۱", "۱۲"],
	];
	expect(labels.slice(0, 2)).toEqual(expected[modes.indexOf(mode)]);
	expect(labels.every((label) => label.length === 2)).toBe(true);
});
