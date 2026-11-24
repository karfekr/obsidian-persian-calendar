import { buildNoteNavigationModel } from "src/components/NoteNavigation/model";
import { getWeekStartCalculator, gregorianToCalendarDate } from "src/utils/dateUtils";
import { describe, expect, it } from "vitest";

// 2026-11-24 corresponds to 1405-09-03 (Azar 3, 1405, Tuesday)
const TODAY = gregorianToCalendarDate(2026, 11, 24);

describe("buildNoteNavigationModel", () => {
	it("builds daily mode for today with current pill, prev/next days, and hidden strip", () => {
		const model = buildNoteNavigationModel(
			{ type: "daily", jy: 1405, jm: 9, jd: 3 },
			"jalali-first-week-start",
			TODAY,
		);

		expect(model.mode).toBe("daily");
		expect(model.isCurrent).toBe(true);
		expect(model.center.currentPillEn).toBe("Today");
		expect(model.center.currentPillFa).toBe("امروز");
		expect(model.center.mainNum).toBe("3");
		expect(model.center.mainFa).toBe("۳ آذر");
		expect(model.center.subItems[0]).toBe("Azar 1405");
		expect(model.center.subItems[2]).toBe("Nov 24, 2026");

		expect(model.prev.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 2 });
		expect(model.next.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 4 });
		expect(model.stripChips).toHaveLength(0);
		expect(model.modeTargets.monthly).toEqual({ mode: "monthly", jy: 1405, jm: 9 });
		expect(model.modeTargets.yearly).toEqual({ mode: "yearly", jy: 1405 });
	});

	it("handles Jalali month rollover in daily mode", () => {
		const model = buildNoteNavigationModel(
			{ type: "daily", jy: 1405, jm: 9, jd: 1 },
			"jalali-first-week-start",
			TODAY,
		);

		expect(model.isCurrent).toBe(false);
		expect(model.center.currentPillEn).toBeUndefined();
		expect(model.prev.target).toEqual({ mode: "daily", jy: 1405, jm: 8, jd: 30 });
		expect(model.next.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 2 });
	});

	it("builds weekly mode with 7 day chips and prev/next week targets", () => {
		const calc = getWeekStartCalculator("jalali-first-week-start");
		const { jy: weekYear, weekNumber } = calc.getWeekNumber(TODAY);
		const start = calc.getStartOfWeek(weekYear, weekNumber);

		const model = buildNoteNavigationModel(
			{
				type: "weekly",
				weekYear,
				weekNumber,
				anchor: { jy: start.jy, jm: start.jm, jd: start.jd },
			},
			"jalali-first-week-start",
			TODAY,
		);

		expect(model.mode).toBe("weekly");
		expect(model.isCurrent).toBe(true);
		expect(model.center.currentPillEn).toBe("This Week");
		expect(model.stripChips).toHaveLength(7);
		expect(model.stripChips.filter((c) => c.active)).toHaveLength(1);
		expect(model.stripChips.find((c) => c.active)?.target).toEqual({
			mode: "daily",
			jy: 1405,
			jm: 9,
			jd: 3,
		});
		expect(model.prev.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber - 1 });
		expect(model.next.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber + 1 });
	});

	it("builds monthly mode with 12 month chips and year wraparound", () => {
		const model = buildNoteNavigationModel(
			{ type: "monthly", jy: 1405, jm: 1 },
			"jalali-first-week-start",
			TODAY,
		);

		expect(model.mode).toBe("monthly");
		expect(model.isCurrent).toBe(false);
		expect(model.prev.target).toEqual({ mode: "monthly", jy: 1404, jm: 12 });
		expect(model.next.target).toEqual({ mode: "monthly", jy: 1405, jm: 2 });
		expect(model.stripChips).toHaveLength(12);
		expect(model.stripChips[0].active).toBe(true);
		expect(model.stripChips[8].target).toEqual({ mode: "monthly", jy: 1405, jm: 9 });
	});

	it("builds yearly mode with 4 season chips and leap-year info", () => {
		const model = buildNoteNavigationModel(
			{ type: "yearly", jy: 1405 },
			"jalali-first-week-start",
			TODAY,
		);

		expect(model.mode).toBe("yearly");
		expect(model.isCurrent).toBe(true);
		expect(model.center.currentPillEn).toBe("This Year");
		expect(model.center.currentPillFa).toBe("امسال");
		expect(model.prev.target).toEqual({ mode: "yearly", jy: 1404 });
		expect(model.next.target).toEqual({ mode: "yearly", jy: 1406 });
		expect(model.stripChips).toHaveLength(4);
		// Azar (month 9) is in Autumn (index 2)
		expect(model.stripChips[2].active).toBe(true);
		expect(model.stripChips[2].target).toEqual({ mode: "monthly", jy: 1405, jm: 7 });
	});
});
