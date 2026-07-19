import { CalendarDate, now } from "@internationalized/date";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type { TGetGregorianDayOfWeek, TGregorian, TLocale, TWeekStart } from "src/types";

const TEHRAN_TZ = "Asia/Tehran";

export function todayTehran(): Date {
	const zdt = now(TEHRAN_TZ);
	return new Date(Date.UTC(zdt.year, zdt.month - 1, zdt.day, 12, 0, 0));
}

export function gregorianToDate(gy: number, gm: number, gd: number) {
	return new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
}

export function dateToGregorian(date: Date): TGregorian {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TEHRAN_TZ,
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(date);

	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);

	return {
		gy: get("year"),
		gm: get("month"),
		gd: get("day"),
	};
}

export function dateToWeekdayName(date: Date, local: TLocale = "fa"): string {
	const locale = local === "fa" ? "fa-IR" : "en-US";

	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: TEHRAN_TZ,
	}).format(date);
}

export function getWeekdayTehran(date: Date): number {
	const tehranDate = new Date(date.toLocaleString("en-US", { timeZone: TEHRAN_TZ }));
	return tehranDate.getDay();
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

export function addDayDate(date: Date, days: number): Date {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() + days);
	return result;
}

export function jalaliToSeason(jm: number): number {
	return Math.ceil(jm / 3);
}

export function gregorianMonthLength(gy: number, gm: number) {
	return new Date(gy, gm, 0).getDate();
}

export function gregorianToStartDayOfWeek(
	{ gYear, gWeekNumber }: TGetGregorianDayOfWeek,
	weekStart: TWeekStart = "sat",
): TGregorian {
	const firstDayOfYear = new Date(Date.UTC(gYear, 0, 1));
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

export function gregorianToStartWeek(gy: number, weekStart: TWeekStart = "sat"): TGregorian {
	const firstDayOfYear = new Date(Date.UTC(gy, 0, 1));
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const result = new CalendarDate(gy, 1, 1).add({ days: offset });

	return {
		gy: result.year,
		gm: result.month,
		gd: result.day,
	};
}
