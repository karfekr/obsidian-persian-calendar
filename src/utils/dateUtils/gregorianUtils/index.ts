import { CalendarDate, GregorianCalendar, getDayOfWeek, toCalendar } from "@internationalized/date";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type { TGetGregorianDayOfWeek, TGregorian, TLocale, TWeekStart } from "src/types";
import { TEHRAN_TZ } from "../tehran";

const gregorian = new GregorianCalendar();

export { todayTehran } from "../tehran";

export function gregorianToCalendarDate(gy: number, gm: number, gd: number): CalendarDate {
	return new CalendarDate(gy, 1, 1).add({ months: gm - 1, days: gd - 1 });
}

export function dateToGregorian(date: CalendarDate): TGregorian {
	const g = toCalendar(date, gregorian);
	return { gy: g.year, gm: g.month, gd: g.day };
}

export function gregorianDayOfWeek(gy: number, gm: number, gd: number): number {
	const day = getWeekdayTehran(new CalendarDate(gy, gm, gd));
	return day === 6 ? 1 : day + 2;
}

export function dateToWeekdayName(date: CalendarDate, local: TLocale = "fa"): string {
	return new Intl.DateTimeFormat(local === "fa" ? "fa-IR" : "en-US", {
		weekday: "long",
		timeZone: TEHRAN_TZ,
	}).format(date.toDate(TEHRAN_TZ));
}

export function getWeekdayTehran(date: CalendarDate): number {
	return getDayOfWeek(date, "en-US", "sun");
}

export const weekStartNumber = (weekStart: TWeekStart): number =>
	({
		sat: 6,
		sun: 0,
		mon: 1,
	})[weekStart];

export function jalaliMonthName(month: number, local: TLocale = "fa") {
	if (month > 12 || month < 1) {
		throw Error("month number is not currect!");
	}
	return JALALI_MONTHS_NAME[local][month];
}

export function seasonName(season: number, local: TLocale = "fa") {
	if (season > 4 || season < 1) {
		throw Error("season number is not currect!");
	}
	return SEASONS_NAME[local][season];
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
	return date.add({ days });
}

export function jalaliToSeason(jm: number): number {
	return Math.ceil(jm / 3);
}

export function gregorianMonthLength(gy: number, gm: number) {
	return gregorian.getDaysInMonth(new CalendarDate(gy, gm, 1));
}

export function calendarDaysBetween(from: CalendarDate, to: CalendarDate): number {
	return to.compare(from);
}

function gWeekNumberInYear(
	targetDate: CalendarDate,
	firstDayOfYear: CalendarDate,
	weekStart: TWeekStart,
): number {
	const diffInDays = calendarDaysBetween(firstDayOfYear, targetDate);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (firstWeekday - weekStartNumber(weekStart) + 7) % 7;
	return Math.ceil((diffInDays + offset + 1) / 7);
}

// gregorian week 1 is the week containing 1 January.
export function dateToGWeekNumber(date: CalendarDate, weekStart: TWeekStart = "sat"): number {
	const { gy } = dateToGregorian(date);
	const next = gregorianToStartDayOfWeek({ gYear: gy + 1, gWeekNumber: 1 }, weekStart);
	if (calendarDaysBetween(gregorianToCalendarDate(next.gy, next.gm, next.gd), date) >= 0) return 1;
	return gWeekNumberInYear(date, gregorianToCalendarDate(gy, 1, 1), weekStart);
}

export function gregorianToStartDayOfWeek(
	{ gYear, gWeekNumber }: TGetGregorianDayOfWeek,
	weekStart: TWeekStart = "sat",
): TGregorian {
	const firstDayOfYear = new CalendarDate(gYear, 1, 1);
	const firstDayWeekday = getWeekdayTehran(firstDayOfYear);
	const weekStartNum = weekStartNumber(weekStart);

	let daysToAdd = weekStartNum - firstDayWeekday;
	if (daysToAdd < 0) daysToAdd += 7;
	if (daysToAdd > 0) daysToAdd -= 7;

	const firstDate = new CalendarDate(gYear, 1, 1);
	const targetDate = firstDate.add({
		days: daysToAdd + (gWeekNumber - 1) * 7,
	});

	return {
		gy: targetDate.year,
		gm: targetDate.month,
		gd: targetDate.day,
	};
}

export function gregorianToEndDayOfWeek(
	{ gYear, gWeekNumber }: TGetGregorianDayOfWeek,
	weekStart: TWeekStart = "sat",
): TGregorian {
	const { gy, gm, gd } = gregorianToStartDayOfWeek({ gYear, gWeekNumber }, weekStart);
	const result = new CalendarDate(gy, gm, gd).add({ days: 6 });

	return {
		gy: result.year,
		gm: result.month,
		gd: result.day,
	};
}

// gregorian week 1 begins on the first occurrence of weekStart in the year.
export function gregorianToStartWeek(
	gy: number,
	gWeekNumber: number = 1,
	weekStart: TWeekStart = "sat",
): TGregorian {
	const firstDayOfYear = new CalendarDate(gy, 1, 1);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const result = new CalendarDate(gy, 1, 1).add({ days: offset + (gWeekNumber - 1) * 7 });

	return {
		gy: result.year,
		gm: result.month,
		gd: result.day,
	};
}

export function gregorianToEndWeek(
	gy: number,
	gWeekNumber: number = 1,
	weekStart: TWeekStart = "sat",
): TGregorian {
	const { gy: sy, gm: sm, gd: sd } = gregorianToStartWeek(gy, gWeekNumber, weekStart);
	const result = new CalendarDate(sy, sm, sd).add({ days: 6 });

	return {
		gy: result.year,
		gm: result.month,
		gd: result.day,
	};
}

export function gregorianToGWeekNumberFromFirstWeekStart(
	date: CalendarDate,
	weekStart: TWeekStart = "sat",
): { gy: number; weekNumber: number } {
	const { gy } = dateToGregorian(date);

	const start = gregorianToStartWeek(gy, 1, weekStart);
	const startDate = gregorianToCalendarDate(start.gy, start.gm, start.gd);
	const diffInDays = calendarDaysBetween(startDate, date);

	if (diffInDays >= 0) {
		return { gy, weekNumber: Math.floor(diffInDays / 7) + 1 };
	}

	const previousYear = gy - 1;
	const previousStart = gregorianToStartWeek(previousYear, 1, weekStart);
	const previousStartDate = gregorianToCalendarDate(
		previousStart.gy,
		previousStart.gm,
		previousStart.gd,
	);
	const previousDiffInDays = calendarDaysBetween(previousStartDate, date);

	return { gy: previousYear, weekNumber: Math.floor(previousDiffInDays / 7) + 1 };
}
