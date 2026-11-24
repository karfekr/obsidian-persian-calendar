import { buildNoteNavigationModel } from "src/components/NoteNavigation/model";
import { getWeekStartCalculator, gregorianToCalendarDate } from "src/utils/dateUtils";
import { describe, expect, it } from "vitest";

// 2026-11-24 corresponds to 1405-09-03 (Azar 3, 1405, Tuesday)
const TODAY = gregorianToCalendarDate(2026, 11, 24);
const PERSIAN_CHARS = /[\u0600-\u06FF]/;
const LATIN_CHARS = /[A-Za-z]/;

describe("buildNoteNavigationModel", () => {
	it("builds daily mode in Persian without Latin text", () => {
		const model = buildNoteNavigationModel(
			{ type: "daily", jy: 1405, jm: 9, jd: 3 },
			"jalali-first-week-start",
			TODAY,
			"fa",
		);

		expect(model.mode).toBe("daily");
		expect(model.locale).toBe("fa");
		expect(model.isCurrent).toBe(true);
		expect(model.noteTypeLabel).toBe("روزنوشت");
		expect(model.currentButtonLabel).toBe("امروز");
		expect(model.center.currentPill).toBe("امروز");
		expect(model.center.main).toBe("۳ آذر");
		expect(model.center.subItems[0]).toBe("۱۴۰۵");
		expect(model.center.subItems[2]).toBe("۲۴ نوامبر ۲۰۲۶");

		expect(model.prev.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 2 });
		expect(model.next.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 4 });
		expect(model.stripChips).toHaveLength(0);

		const allText = [
			model.noteTypeLabel,
			model.currentButtonLabel,
			model.prev.kicker,
			model.prev.main,
			model.prev.sub,
			model.center.kicker,
			model.center.currentPill,
			model.center.main,
			...model.center.subItems,
			model.next.kicker,
			model.next.main,
			model.next.sub,
		].join(" ");
		expect(allText).not.toMatch(LATIN_CHARS);
	});

	it("builds daily mode in English without Persian text", () => {
		const model = buildNoteNavigationModel(
			{ type: "daily", jy: 1405, jm: 9, jd: 3 },
			"jalali-first-week-start",
			TODAY,
			"en",
		);

		expect(model.locale).toBe("en");
		expect(model.noteTypeLabel).toBe("Daily Note");
		expect(model.currentButtonLabel).toBe("Today");
		expect(model.center.currentPill).toBe("Today");
		expect(model.center.main).toBe("3 Azar");
		expect(model.center.subItems[0]).toBe("1405");
		expect(model.center.subItems[2]).toBe("Nov 24, 2026");

		const allText = [
			model.noteTypeLabel,
			model.currentButtonLabel,
			model.prev.kicker,
			model.prev.main,
			model.prev.sub,
			model.center.kicker,
			model.center.currentPill,
			model.center.main,
			...model.center.subItems,
			model.next.kicker,
			model.next.main,
			model.next.sub,
		].join(" ");
		expect(allText).not.toMatch(PERSIAN_CHARS);
	});

	it("handles Jalali month rollover in daily mode", () => {
		const model = buildNoteNavigationModel(
			{ type: "daily", jy: 1405, jm: 9, jd: 1 },
			"jalali-first-week-start",
			TODAY,
			"en",
		);

		expect(model.isCurrent).toBe(false);
		expect(model.center.currentPill).toBeUndefined();
		expect(model.prev.target).toEqual({ mode: "daily", jy: 1405, jm: 8, jd: 30 });
		expect(model.next.target).toEqual({ mode: "daily", jy: 1405, jm: 9, jd: 2 });
	});

	it("builds weekly mode with 7 day chips and prev/next week targets", () => {
		const calc = getWeekStartCalculator("jalali-first-week-start");
		const { jy: weekYear, weekNumber } = calc.getWeekNumber(TODAY);
		const start = calc.getStartOfWeek(weekYear, weekNumber);

		const modelFa = buildNoteNavigationModel(
			{
				type: "weekly",
				weekYear,
				weekNumber,
				anchor: { jy: start.jy, jm: start.jm, jd: start.jd },
			},
			"jalali-first-week-start",
			TODAY,
			"fa",
		);

		expect(modelFa.mode).toBe("weekly");
		expect(modelFa.isCurrent).toBe(true);
		expect(modelFa.noteTypeLabel).toBe("هفته‌نوشت");
		expect(modelFa.center.currentPill).toBe("این هفته");
		expect(modelFa.stripChips).toHaveLength(7);
		expect(modelFa.stripChips.filter((c) => c.active)).toHaveLength(1);
		expect(modelFa.stripChips.find((c) => c.active)?.target).toEqual({
			mode: "daily",
			jy: 1405,
			jm: 9,
			jd: 3,
		});
		expect(modelFa.prev.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber - 1 });
		expect(modelFa.next.target).toEqual({ mode: "weekly", weekYear, weekNumber: weekNumber + 1 });

		const modelEn = buildNoteNavigationModel(
			{
				type: "weekly",
				weekYear,
				weekNumber,
				anchor: { jy: start.jy, jm: start.jm, jd: start.jd },
			},
			"jalali-first-week-start",
			TODAY,
			"en",
		);
		expect(modelEn.noteTypeLabel).toBe("Weekly Note");
		expect(modelEn.center.currentPill).toBe("This Week");
		expect(modelEn.stripChips.map((c) => c.label).join(" ")).not.toMatch(PERSIAN_CHARS);
	});

	it("builds monthly mode with 12 month chips and year wraparound", () => {
		const model = buildNoteNavigationModel(
			{ type: "monthly", jy: 1405, jm: 1 },
			"jalali-first-week-start",
			TODAY,
			"fa",
		);

		expect(model.mode).toBe("monthly");
		expect(model.isCurrent).toBe(false);
		expect(model.noteTypeLabel).toBe("ماه‌نوشت");
		expect(model.prev.target).toEqual({ mode: "monthly", jy: 1404, jm: 12 });
		expect(model.next.target).toEqual({ mode: "monthly", jy: 1405, jm: 2 });
		expect(model.stripChips).toHaveLength(12);
		expect(model.stripChips[0].active).toBe(true);
		expect(model.stripChips[0].label).toBe("فروردین");
		expect(model.stripChips[8].target).toEqual({ mode: "monthly", jy: 1405, jm: 9 });
	});

	it("builds yearly mode with 4 season chips and leap-year info", () => {
		const modelFa = buildNoteNavigationModel(
			{ type: "yearly", jy: 1405 },
			"jalali-first-week-start",
			TODAY,
			"fa",
		);

		expect(modelFa.mode).toBe("yearly");
		expect(modelFa.isCurrent).toBe(true);
		expect(modelFa.noteTypeLabel).toBe("سال‌نوشت");
		expect(modelFa.center.currentPill).toBe("امسال");
		expect(modelFa.prev.target).toEqual({ mode: "yearly", jy: 1404 });
		expect(modelFa.next.target).toEqual({ mode: "yearly", jy: 1406 });
		expect(modelFa.stripChips).toHaveLength(4);
		// Azar (month 9) is in Autumn (index 2)
		expect(modelFa.stripChips[2].active).toBe(true);
		expect(modelFa.stripChips[2].label).toBe("پاییز");
		expect(modelFa.stripChips[2].target).toEqual({ mode: "monthly", jy: 1405, jm: 7 });

		const modelEn = buildNoteNavigationModel(
			{ type: "yearly", jy: 1405 },
			"jalali-first-week-start",
			TODAY,
			"en",
		);
		expect(modelEn.noteTypeLabel).toBe("Yearly Note");
		expect(modelEn.center.currentPill).toBe("This Year");
		expect(modelEn.stripChips[2].label).toBe("Autumn");
	});
});
