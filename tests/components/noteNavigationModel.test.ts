import { buildNoteNavigationModel } from "src/components/NoteNavigation/model";
import type { TWeekCalculationMode } from "src/types";
import { getWeekStartCalculator, jalaliToCalendarDate } from "src/utils/dateUtils";
import { describe, expect, it } from "vitest";

const TODAY = jalaliToCalendarDate(1405, 9, 3);
const WEEK_MODE = "jalali-first-week-start";

function buildWeeklyModel(
	weekYear: number,
	weekNumber: number,
	weekCalculation: TWeekCalculationMode = WEEK_MODE,
	today = TODAY,
) {
	const { jy, jm, jd } = getWeekStartCalculator(weekCalculation).getStartOfWeek(
		weekYear,
		weekNumber,
	);
	return buildNoteNavigationModel(
		{ type: "weekly", weekYear, weekNumber, anchor: { jy, jm, jd } },
		weekCalculation,
		today,
	);
}

describe("buildNoteNavigationModel", () => {
	it.each([
		["fa", "۱۴۰۵", "روزنوشت", "امروز", "سه‌شنبه", "۳ آذر", "۲ آذر", "۴ آذر"],
		["en", "1405", "Daily Note", "Today", "Tue", "3 Azar", "2 Azar", "4 Azar"],
	] as const)(
		"shows inline Jalali daily dates without a week strip in %s",
		(locale, year, noteTypeLabel, currentButtonLabel, weekday, date, prev, next) => {
			const model = buildNoteNavigationModel(
				{ type: "daily", jy: 1405, jm: 9, jd: 3 },
				WEEK_MODE,
				TODAY,
				locale,
			);

			expect(model).toMatchObject({
				locale,
				year,
				isCurrent: true,
				noteTypeLabel,
				currentButtonLabel,
			});
			expect(model.center).toEqual({ kicker: weekday, main: date });
			expect(model.prev.main).toBe(prev);
			expect(model.next.main).toBe(next);
		},
	);

	it.each([
		[1405, 9, 1405, 8, 30],
		[1404, 1, 1403, 12, 30],
		[1405, 1, 1404, 12, 29],
	])("steps back from day one of Jalali %i/%i", (jy, jm, prevYear, prevMonth, prevDay) => {
		const model = buildNoteNavigationModel({ type: "daily", jy, jm, jd: 1 }, WEEK_MODE, TODAY);
		expect(model.isCurrent).toBe(false);
		expect(model.prev.target).toEqual({
			mode: "daily",
			jy: prevYear,
			jm: prevMonth,
			jd: prevDay,
		});
		expect(model.next.target).toEqual({ mode: "daily", jy, jm, jd: 2 });
	});

	it("shows the weekly Jalali date range without a footer strip", () => {
		const { jy: weekYear, weekNumber } = getWeekStartCalculator(WEEK_MODE).getWeekNumber(TODAY);
		const model = buildWeeklyModel(weekYear, weekNumber);

		expect(model).toMatchObject({
			year: "۱۴۰۵",
			isCurrent: true,
			noteTypeLabel: "هفته‌نوشت",
			currentButtonLabel: "این هفته",
		});
		expect(model.center).toEqual({ kicker: "هفته ۳۶", main: "۳۰ آبان تا ۶ آذر" });
		expect(model.prev.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber - 1 });
		expect(model.next.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber + 1 });
		expect(model).not.toHaveProperty("stripChips");
	});

	it.each(["jalali-first-week-start", "jalali-first-day-of-year"] as const)(
		"steps between Esfand and Farvardin weeks with %s",
		(mode) => {
			const firstWeek = buildWeeklyModel(1404, 1, mode);
			const previous = firstWeek.prev.target;
			expect(firstWeek.year).toBe("۱۴۰۴");
			expect(previous).toMatchObject({ mode: "weekly", weekYear: 1403 });

			if (previous.mode !== "weekly") throw new Error("Expected a weekly target");
			const lastWeek = buildWeeklyModel(previous.weekYear, previous.weekNumber, mode);
			expect(lastWeek.year).toBe("۱۴۰۳");
			expect(lastWeek.next.target).toEqual({ mode: "weekly", weekYear: 1404, weekNumber: 1 });
		},
	);

	it("keeps Gregorian-based weekly filenames as targets while displaying Jalali dates", () => {
		const mode = "gregorian-first-week-start";
		const { jy: weekYear, weekNumber } = getWeekStartCalculator(mode).getWeekNumber(TODAY);
		const model = buildWeeklyModel(weekYear, weekNumber, mode);

		expect(weekYear).toBe(2026);
		expect(model.year).toBe("۱۴۰۵");
		expect(model.center).toEqual({ kicker: undefined, main: "۳۰ آبان تا ۶ آذر" });
		expect(model.prev).toEqual({
			main: "هفته قبل",
			target: { mode: "weekly", weekYear: 2026, weekNumber: weekNumber - 1 },
		});
		expect(model.todayTarget).toEqual({ mode: "weekly", weekYear, weekNumber });
	});

	it("keeps only the adjacent months and wraps across the Jalali year", () => {
		const farvardin = buildNoteNavigationModel(
			{ type: "monthly", jy: 1405, jm: 1 },
			WEEK_MODE,
			TODAY,
		);
		const esfand = buildNoteNavigationModel(
			{ type: "monthly", jy: 1405, jm: 12 },
			WEEK_MODE,
			TODAY,
		);

		expect(farvardin.year).toBe("۱۴۰۵");
		expect(farvardin.center).toEqual({ main: "فروردین" });
		expect(farvardin.prev).toEqual({
			main: "اسفند",
			target: { mode: "monthly", jy: 1404, jm: 12 },
		});
		expect(esfand.next).toEqual({ main: "فروردین", target: { mode: "monthly", jy: 1406, jm: 1 } });
		expect(farvardin.todayTarget).toEqual({ mode: "monthly", jy: 1405, jm: 9 });
	});

	it("shows Jalali seasons and wraps between winter and spring", () => {
		const spring = buildNoteNavigationModel(
			{ type: "seasonal", jy: 1405, seasonNumber: 1 },
			WEEK_MODE,
			TODAY,
		);
		const winter = buildNoteNavigationModel(
			{ type: "seasonal", jy: 1404, seasonNumber: 4 },
			WEEK_MODE,
			TODAY,
			"en",
		);
		expect(spring).toMatchObject({
			year: "۱۴۰۵",
			noteTypeLabel: "فصل‌نوشت",
			currentButtonLabel: "این فصل",
			isCurrent: false,
			center: { main: "بهار" },
			prev: { main: "زمستان", target: { mode: "seasonal", jy: 1404, seasonNumber: 4 } },
			todayTarget: { mode: "seasonal", jy: 1405, seasonNumber: 3 },
		});
		expect(winter).toMatchObject({
			year: "1404",
			currentButtonLabel: "This Season",
			center: { main: "Winter" },
			next: { main: "Spring", target: { mode: "seasonal", jy: 1405, seasonNumber: 1 } },
		});
	});

	it("matches the current season by Jalali year and season number", () => {
		const current = { type: "seasonal", jy: 1405, seasonNumber: 3 } as const;
		expect(buildNoteNavigationModel(current, WEEK_MODE, TODAY).isCurrent).toBe(true);
		expect(buildNoteNavigationModel({ ...current, jy: 1404 }, WEEK_MODE, TODAY).isCurrent).toBe(
			false,
		);
	});

	it("shows the yearly number in the header and retains adjacent-year targets", () => {
		const model = buildNoteNavigationModel({ type: "yearly", jy: 1405 }, WEEK_MODE, TODAY);

		expect(model).toMatchObject({
			year: "۱۴۰۵",
			isCurrent: true,
			currentButtonLabel: "امسال",
			prev: { main: "۱۴۰۴", target: { mode: "yearly", jy: 1404 } },
			next: { main: "۱۴۰۶", target: { mode: "yearly", jy: 1406 } },
		});
		expect(model.center).toBeUndefined();
	});
});
