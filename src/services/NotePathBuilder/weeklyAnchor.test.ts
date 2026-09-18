import { describe, expect, it } from "vitest";
import NotePathBuilder from "src/services/NotePathBuilder";
import { compilePattern } from "src/utils/dateEngine";
import { getWeekStartCalculator, gregorianToJalali, jalaliToDate } from "src/utils/dateUtils";
import type { TSetting } from "src/types";

const makePlugin = (
	weeklyNotesPath: string,
	weeklyPathAnchor: "start" | "end" = "start",
	weekCalculation: TSetting["weekCalculation"] = "jalali-first-day-of-year",
	weeklyPathYearBoundaryAnchor: "start" | "end" = "start",
) => ({
	setting: {
		weeklyNotesPath,
		weeklyPathAnchor,
		weekCalculation,
		weeklyPathYearBoundaryAnchor,
	} as Pick<
		TSetting,
		"weeklyNotesPath" | "weeklyPathAnchor" | "weekCalculation" | "weeklyPathYearBoundaryAnchor"
	>,
} as never);

describe("Weekly path anchor visibility", () => {
	const dateTokens = [
		"YYYY",
		"YY",
		"MMMM",
		"MMM",
		"MM",
		"M",
		"DD",
		"D",
		"jYYYY",
		"jYY",
		"jMMMM",
		"jMMM",
		"jMM",
		"jM",
		"jDD",
		"jD",
		"Q",
		"QQ",
		"QQQ",
		"QQQQ",
		"jQ",
		"jQQ",
		"jQQQQ",
	];

	it.each(dateTokens)("shows Anchor for %s/ww", (token) => {
		expect(new NotePathBuilder(makePlugin(`${token}/ww`)).weeklyPathNeedsAnchor()).toBe(true);
	});

	it.each(["ww", "Weekly/ww", "Weekly", "", "YYYY", "jYYYY", "QQQQ"])("does not show Anchor for %s", (path) => {
		expect(new NotePathBuilder(makePlugin(path)).weeklyPathNeedsAnchor()).toBe(false);
	});

	it("does not show Anchor when date variable is not an ancestor of week variable", () => {
		expect(new NotePathBuilder(makePlugin("ww/jYYYY")).weeklyPathNeedsAnchor()).toBe(false);
	});

	it("does not show Anchor when week and date variables are in the same folder", () => {
		expect(new NotePathBuilder(makePlugin("jYYYY-ww")).weeklyPathNeedsAnchor()).toBe(false);
	});

	it("recognizes mixed Jalali and Gregorian date tokens", () => {
		expect(new NotePathBuilder(makePlugin("YYYY/jMM/QQQQ/ww")).weeklyPathNeedsAnchor()).toBe(true);
	});

	it("shows the year-boundary Anchor only for first-full-week calculations with an eligible date field", () => {
		const builder = new NotePathBuilder(makePlugin("YYYY/ww", "start", "jalali-first-week-start"));
		expect(builder.weeklyPathNeedsYearBoundaryAnchor()).toBe(true);

		expect(
			new NotePathBuilder(makePlugin("YYYY/ww", "start", "jalali-first-day-of-year"))
				.weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(false);
		expect(
			new NotePathBuilder(makePlugin("ww", "start", "jalali-first-week-start"))
				.weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(false);
	});

	it("shows the year-boundary Anchor for Gregorian first-full-week calculations", () => {
		expect(
			new NotePathBuilder(makePlugin("YYYY/ww", "start", "gregorian-first-week-start"))
				.weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(true);
	});
});

describe("Weekly path anchor resolution", () => {
	const calculator = getWeekStartCalculator("jalali-first-day-of-year");

	it("uses the Gregorian quarter at the selected anchor", () => {
		const jalali = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(jalaliToDate(jalali.jy, jalali.jm, jalali.jd));
		const start = new NotePathBuilder(makePlugin("YYYY/QQQQ/ww", "start")).buildWeeklyNotePath(weekYear, weekNumber);
		const end = new NotePathBuilder(makePlugin("YYYY/QQQQ/ww", "end")).buildWeeklyNotePath(weekYear, weekNumber);

		expect(start.filePath).toContain("2026/Spring/");
		expect(end.filePath).toContain("2026/Summer/");
	});

	it("resolves Gregorian and Jalali month from the selected anchor", () => {
		const jalali = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(jalaliToDate(jalali.jy, jalali.jm, jalali.jd));
		const start = new NotePathBuilder(makePlugin("YYYY/MMMM/jMM/ww", "start")).buildWeeklyNotePath(weekYear, weekNumber);
		const end = new NotePathBuilder(makePlugin("YYYY/MMMM/jMM/ww", "end")).buildWeeklyNotePath(weekYear, weekNumber);

		expect(start.filePath).toContain("2026/March/01/");
		expect(end.filePath).toContain("2026/April/01/");
	});

	it("resolves mixed Jalali and Gregorian tokens", () => {
		const jalali = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(jalaliToDate(jalali.jy, jalali.jm, jalali.jd));
		const start = new NotePathBuilder(makePlugin("YYYY/jMM/QQ/ww", "start")).buildWeeklyNotePath(weekYear, weekNumber);
		const end = new NotePathBuilder(makePlugin("YYYY/jMM/QQ/ww", "end")).buildWeeklyNotePath(weekYear, weekNumber);

		expect(start.filePath).toContain("2026/01/01/");
		expect(end.filePath).toContain("2026/01/02/");
	});

	it("uses the Gregorian week calculator", () => {
		const calc = getWeekStartCalculator("gregorian-first-day-of-year");
		const { jy, jm, jd } = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calc.getWeekNumber(jalaliToDate(jy, jm, jd));
		const start = new NotePathBuilder(
			makePlugin("YYYY/QQQQ/ww", "start", "gregorian-first-day-of-year"),
		).buildWeeklyNotePath(weekYear, weekNumber);
		const end = new NotePathBuilder(
			makePlugin("YYYY/QQQQ/ww", "end", "gregorian-first-day-of-year"),
		).buildWeeklyNotePath(weekYear, weekNumber);

		expect(start.filePath).toContain("2026/Spring/");
		expect(end.filePath).toContain("2026/Summer/");
	});

	it("uses the configured anchor for a Jalali cross-year first-full week", () => {
		const calc = getWeekStartCalculator("jalali-first-week-start");
		let weekNumber = 0;
		for (let candidate = 1; candidate <= 53; candidate++) {
			const start = calc.getStartOfWeek(1404, candidate);
			const end = calc.getEndOfWeek(1404, candidate);
			if (start.jy !== end.jy) {
				weekNumber = candidate;
				break;
			}
		}

		expect(weekNumber).not.toBe(0);

		const start = new NotePathBuilder(
			makePlugin("jYYYY/jMM/ww", "end", "jalali-first-week-start", "start"),
		).buildWeeklyNotePath(1404, weekNumber);
		const end = new NotePathBuilder(
			makePlugin("jYYYY/jMM/ww", "start", "jalali-first-week-start", "end"),
		).buildWeeklyNotePath(1404, weekNumber);

		expect(start.filePath).toBe(end.filePath);
		expect(start.filePath).toContain("1404/");
	});

	it("uses the configured anchor for a Gregorian cross-year first-full week", () => {
		const calc = getWeekStartCalculator("gregorian-first-week-start");
		let weekNumber = 0;
		for (let candidate = 1; candidate <= 53; candidate++) {
			const start = calc.getStartOfWeek(2025, candidate);
			const end = calc.getEndOfWeek(2025, candidate);
			if (start.gy !== end.gy) {
				weekNumber = candidate;
				break;
			}
		}

		expect(weekNumber).not.toBe(0);

		const start = new NotePathBuilder(
			makePlugin("YYYY/QQQQ/ww", "end", "gregorian-first-week-start", "start"),
		).buildWeeklyNotePath(2025, weekNumber);
		const end = new NotePathBuilder(
			makePlugin("YYYY/QQQQ/ww", "start", "gregorian-first-week-start", "end"),
		).buildWeeklyNotePath(2025, weekNumber);

		expect(start.filePath).toBe(end.filePath);
		expect(start.filePath).toContain("2025/");
	});
});

describe("Weekly path token fields", () => {
	it.each([
		["YYYY/ww", ["gy", "week"]],
		["MMMM/ww", ["gm", "week"]],
		["QQQQ/ww", ["quarter", "week"]],
		["jYYYY/ww", ["jy", "week"]],
		["jMMMM/ww", ["jm", "week"]],
		["jQQQQ/ww", ["season", "week"]],
	])("compiles %s into expected fields", (pattern, fields) => {
		expect(compilePattern(pattern).fields).toEqual(fields);
	});
});
