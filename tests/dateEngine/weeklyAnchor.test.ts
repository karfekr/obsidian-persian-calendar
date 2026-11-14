import NotePathBuilder from "src/services/NotePathBuilder";
import type { TSetting } from "src/types";
import {
	getWeekStartCalculator,
	gregorianToJalali,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";

const makePlugin = (
	weeklyNotesPath: string,
	weekCalculation: TSetting["weekCalculation"] = "jalali-first-day-of-year",
) =>
	({
		setting: {
			weeklyNotesPath,
			weekCalculation,
		} as Pick<TSetting, "weeklyNotesPath" | "weekCalculation">,
	}) as never;

describe("Weekly note path resolution", () => {
	const calculator = getWeekStartCalculator("jalali-first-day-of-year");

	it("resolves Gregorian and Jalali month from the selected anchor", () => {
		const jalali = gregorianToJalali(2026, 3, 30);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(
			jalaliToCalendarDate(jalali.jy, jalali.jm, jalali.jd),
		);
		const start = new NotePathBuilder(makePlugin("YYYY/MMMM/jMM/ww")).buildWeeklyNotePath(
			weekYear,
			weekNumber,
		);

		expect(start.filePath).toContain("2026/March/01/");
	});
});
