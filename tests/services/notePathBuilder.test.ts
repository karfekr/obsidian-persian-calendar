import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type { TSetting } from "src/types";
import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { DatePatternFormatError } from "src/utils/dateEngine/errors";
import { formatPattern } from "src/utils/dateEngine/formatter";
import { getWeekStartCalculator } from "src/utils/dateUtils";

beforeEach(() => {
	clearCompiledPatternCache();
});

function createBuilder(settingOverrides: Partial<TSetting> = {}) {
	const plugin = {
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
	} as unknown as PersianCalendarPlugin;

	return new NotePathBuilder(plugin);
}

describe("NotePathBuilder.buildEngineContext", () => {
	it("derives the Jalali season from a full Jalali date", () => {
		const builder = createBuilder();
		expect(builder.buildEngineContext({ jy: 1403, jm: 4, jd: 10 }).season).toBe(2);
	});

	it("derives the Jalali season from a full Gregorian date alone", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ gy: 2024, gm: 7, gd: 1 });
		expect(ctx.jy).toBeDefined();
		expect(ctx.jm).toBeDefined();
		expect(ctx.season).toBeDefined();
	});

	it("derives Gregorian fields from a full Jalali date", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ jy: 1403, jm: 1, jd: 1 });
		expect(ctx.gy).toBeDefined();
		expect(ctx.gm).toBeDefined();
		expect(ctx.gd).toBeDefined();
	});

	it("anchors to the season's first month/day when only the season is known", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ jy: 1403, season: 3 });
		// Season 3 (Paeez) starts at Jalali month 7.
		expect(ctx.jm).toBe(7);
		expect(ctx.jd).toBe(1);
		expect(ctx.gy).toBeDefined();
	});
});

describe("NotePathBuilder - mixed-calendar dynamic paths (regression)", () => {
	it("resolves YYYY/jQQ for the yearly note path instead of throwing", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves jYYYY/jQQ for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "jYYYY/jQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jQQQQ for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jQQQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jMMMM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jMMMM" });
		const { filePath } = builder.buildYearlyNotePath(1403);
		expect(filePath).toContain("Farvardin");
	});

	it("resolves jYYYY/MM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "jYYYY/MM" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jMM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jMM" });
		const { filePath } = builder.buildYearlyNotePath(1403);
		expect(filePath).toMatch(/\d{4}\/01\//);
	});

	it("resolves YYYY/jQQ for the seasonal note path", () => {
		const builder = createBuilder({ seasonalNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildSeasonalNotePath(1403, 3)).not.toThrow();
	});

	it("resolves jYYYY/MM for the seasonal note path", () => {
		const builder = createBuilder({ seasonalNotesPath: "jYYYY/MM" });
		expect(() => builder.buildSeasonalNotePath(1403, 3)).not.toThrow();
	});

	it("still resolves purely Gregorian yearly paths", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/MM/DD" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("still resolves purely Jalali seasonal paths", () => {
		const builder = createBuilder({ seasonalNotesPath: "jYYYY/jQQQQ" });
		expect(() => builder.buildSeasonalNotePath(1403, 1)).not.toThrow();
	});

	it("still resolves the default daily/weekly/monthly note paths", () => {
		const builder = createBuilder();
		expect(() => builder.buildDailyNotePath(1403, 1, 1)).not.toThrow();
		expect(() => builder.buildWeeklyNotePath(1403, 1)).not.toThrow();
		expect(() => builder.buildMonthlyNotePath(1403, 1)).not.toThrow();
	});

	it("resolves mixed YYYY/jQQ for the monthly note path (full context already available)", () => {
		const builder = createBuilder({ monthlyNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildMonthlyNotePath(1403, 4)).not.toThrow();
	});

	it("still throws a DatePatternFormatError when a field genuinely cannot be derived", () => {
		const builder = createBuilder();
		expect(() => formatPattern("jMM", builder.buildEngineContext({ jy: 1403 }))).toThrow(
			DatePatternFormatError,
		);
	});
});

describe("NotePathBuilder - weekly note folders at year boundaries", () => {
	function weekly(
		weekCalculation: TSetting["weekCalculation"],
		weeklyNotesPath: string,
		weeklyPathMonth: TSetting["weeklyPathMonth"],
		year: number,
		week: number,
	) {
		return createBuilder({ weekCalculation, weeklyNotesPath, weeklyPathMonth }).buildWeeklyNotePath(
			year,
			week,
		);
	}

	// a week between two years stays in its own year, whatever the start/end setting is
	function expectSameFolder(
		weekCalculation: TSetting["weekCalculation"],
		path: string,
		year: number,
		week: number,
		folder: RegExp,
	) {
		expect(weekly(weekCalculation, path, "start", year, week).filePath).toMatch(folder);
		expect(weekly(weekCalculation, path, "end", year, week).filePath).toMatch(folder);
	}

	it("keeps the filename format unchanged", () => {
		const b = createBuilder({ weeklyNotesPath: "jYYYY/jMM/[W]ww" });
		expect(b.buildWeeklyNotePath(1403, 1).fileName).toBe("1403-W1.md");
	});

	it("defaults to the week start", () => {
		const path = "jYYYY/jMM/[W]ww";
		const byDefault = createBuilder({ weeklyNotesPath: path }).buildWeeklyNotePath(1403, 9);
		const start = weekly("jalali-first-week-start", path, "start", 1403, 9);
		expect(byDefault.filePath).toBe(start.filePath);
	});

	it("Jalali first-week-start: the last week of a year stays in that year", () => {
		const calc = getWeekStartCalculator("jalali-first-week-start");
		expect(calc.getStartOfWeek(1405, 53)).toMatchObject({ jy: 1405, jm: 12 });
		expect(calc.getEndOfWeek(1405, 53)).toMatchObject({ jy: 1406, jm: 1 });

		expectSameFolder("jalali-first-week-start", "jYYYY/jMM/[W]ww", 1405, 53, /^1405\/12\/W53\//);
		expect(weekly("jalali-first-week-start", "jYYYY/jMM/[W]ww", "end", 1405, 53).fileName).toBe(
			"1405-W53.md",
		);
		// The same holds for an ordinary year.
		expectSameFolder("jalali-first-week-start", "jYYYY/jMM/[W]ww", 1403, 52, /^1403\/12\/W52\//);
	});

	it("Jalali first-day-of-year: week 1 from the previous year goes to the new year", () => {
		const calc = getWeekStartCalculator("jalali-first-day-of-year");
		expect(calc.getStartOfWeek(1404, 1)).toMatchObject({ jy: 1403, jm: 12 });
		expect(calc.getEndOfWeek(1404, 1)).toMatchObject({ jy: 1404, jm: 1 });

		expectSameFolder("jalali-first-day-of-year", "jYYYY/jMM/[W]ww", 1404, 1, /^1404\/01\/W01\//);
		expectSameFolder("jalali-first-day-of-year", "jYYYY/jMM/[W]ww", 1403, 1, /^1403\/01\/W01\//);
	});

	it("Gregorian: a week spanning two years is filed under the year in its name", () => {
		const first = getWeekStartCalculator("gregorian-first-week-start");
		expect(first.getStartOfWeek(2024, 52)).toMatchObject({ gy: 2024, gm: 12 });
		expect(first.getEndOfWeek(2024, 52)).toMatchObject({ gy: 2025, gm: 1 });
		expectSameFolder("gregorian-first-week-start", "YYYY/MM/[W]ww", 2024, 52, /^2024\/12\/W52\//);

		const firstDay = getWeekStartCalculator("gregorian-first-day-of-year");
		expect(firstDay.getStartOfWeek(2024, 1)).toMatchObject({ gy: 2023, gm: 12 });
		expect(firstDay.getEndOfWeek(2024, 1)).toMatchObject({ gy: 2024, gm: 1 });
		expectSameFolder("gregorian-first-day-of-year", "YYYY/MM/[W]ww", 2024, 1, /^2024\/01\/W01\//);
	});

	it("resolves the season and mixed-calendar tokens from the same date as the year", () => {
		expectSameFolder("jalali-first-week-start", "jYYYY/jQQ/[W]ww", 1403, 52, /^1403\/04\//);
		expectSameFolder("jalali-first-day-of-year", "jYYYY/jQQ/[W]ww", 1404, 1, /^1404\/01\//);
		expectSameFolder("jalali-first-week-start", "jYYYY/MM/[W]ww", 1403, 52, /^1403\/03\//);
		expectSameFolder("gregorian-first-week-start", "YYYY/jMM/[W]ww", 2024, 52, /^2024\/10\//);
	});

	it("uses the start/end setting for a week that spans two months of the same year", () => {
		const jalali = getWeekStartCalculator("jalali-first-week-start");
		expect(jalali.getStartOfWeek(1403, 9)).toMatchObject({ jy: 1403, jm: 2 });
		expect(jalali.getEndOfWeek(1403, 9)).toMatchObject({ jy: 1403, jm: 3 });
		const path = "jYYYY/jMM/[W]ww";
		const start = weekly("jalali-first-week-start", path, "start", 1403, 9);
		const end = weekly("jalali-first-week-start", path, "end", 1403, 9);
		expect(start.filePath).toMatch(/^1403\/02\//);
		expect(end.filePath).toMatch(/^1403\/03\//);

		const gregorian = getWeekStartCalculator("gregorian-first-week-start");
		expect(gregorian.getStartOfWeek(2024, 4)).toMatchObject({ gy: 2024, gm: 1 });
		expect(gregorian.getEndOfWeek(2024, 4)).toMatchObject({ gy: 2024, gm: 2 });
		const gPath = "YYYY/MM/[W]ww";
		const gStart = weekly("gregorian-first-week-start", gPath, "start", 2024, 4);
		const gEnd = weekly("gregorian-first-week-start", gPath, "end", 2024, 4);
		expect(gStart.filePath).toMatch(/^2024\/01\//);
		expect(gEnd.filePath).toMatch(/^2024\/02\//);
	});

	it("gives the same folder for start and end when the week stays within one month", () => {
		const path = "jYYYY/jMM/[W]ww";
		const start = weekly("jalali-first-week-start", path, "start", 1403, 10);
		const end = weekly("jalali-first-week-start", path, "end", 1403, 10);
		expect(end.filePath).toBe(start.filePath);
		expect(start.filePath).toMatch(/^1403\/03\/W10\//);
	});
});
