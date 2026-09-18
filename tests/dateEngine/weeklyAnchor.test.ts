import NotePathBuilder from "src/services/NotePathBuilder";
import type { TSetting } from "src/types";
import { getWeekStartCalculator, gregorianToJalali, jalaliToDate } from "src/utils/dateUtils";

const makePlugin = (
	weeklyNotesPath: string,
	weeklyPathAnchor: "start" | "end" = "start",
	weekCalculation: TSetting["weekCalculation"] = "jalali-first-day-of-year",
	weeklyPathYearBoundaryAnchor: "start" | "end" = "start",
) =>
	({
		setting: {
			weeklyNotesPath,
			weeklyPathAnchor,
			weekCalculation,
			weeklyPathYearBoundaryAnchor,
		} as Pick<
			TSetting,
			"weeklyNotesPath" | "weeklyPathAnchor" | "weekCalculation" | "weeklyPathYearBoundaryAnchor"
		>,
	}) as never;

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
		"jQ",
		"jQQ",
		"jQQQQ",
	];

	it.each(dateTokens)("shows Anchor for %s/ww", (token) => {
		expect(new NotePathBuilder(makePlugin(`${token}/ww`)).weeklyPathNeedsAnchor()).toBe(true);
	});

	it("does not show Anchor when date variable is not an ancestor of week variable", () => {
		expect(new NotePathBuilder(makePlugin("ww/jYYYY")).weeklyPathNeedsAnchor()).toBe(false);
	});

	it("does not show Anchor when week and date variables are in the same folder", () => {
		expect(new NotePathBuilder(makePlugin("jYYYY-ww")).weeklyPathNeedsAnchor()).toBe(false);
	});

	it("shows the year-boundary Anchor only for first-full-week calculations with an eligible date field", () => {
		const builder = new NotePathBuilder(makePlugin("YYYY/ww", "start", "jalali-first-week-start"));
		expect(builder.weeklyPathNeedsYearBoundaryAnchor()).toBe(true);

		expect(
			new NotePathBuilder(
				makePlugin("YYYY/ww", "start", "jalali-first-day-of-year"),
			).weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(false);
		expect(
			new NotePathBuilder(
				makePlugin("ww", "start", "jalali-first-week-start"),
			).weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(false);
	});

	it("shows the year-boundary Anchor for Gregorian first-full-week calculations", () => {
		expect(
			new NotePathBuilder(
				makePlugin("YYYY/ww", "start", "gregorian-first-week-start"),
			).weeklyPathNeedsYearBoundaryAnchor(),
		).toBe(true);
	});
});

describe("Weekly path anchor resolution", () => {
	const calculator = getWeekStartCalculator("jalali-first-day-of-year");

	it("resolves Gregorian and Jalali month from the selected anchor", () => {
		const jalali = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(
			jalaliToDate(jalali.jy, jalali.jm, jalali.jd),
		);
		const start = new NotePathBuilder(makePlugin("YYYY/MMMM/jMM/ww", "start")).buildWeeklyNotePath(
			weekYear,
			weekNumber,
		);
		const end = new NotePathBuilder(makePlugin("YYYY/MMMM/jMM/ww", "end")).buildWeeklyNotePath(
			weekYear,
			weekNumber,
		);

		expect(start.filePath).toContain("2026/March/01/");
		expect(end.filePath).toContain("2026/April/01/");
	});
});
