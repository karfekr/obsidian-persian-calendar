import {
	CalendarDate,
	GregorianCalendar,
	PersianCalendar,
	toCalendar,
} from "@internationalized/date";
import type { TGetJalaliDayOfWeek, TGregorian, THijriBase, TJalali, TWeekStart } from "src/types";

import {
	calendarDaysBetween,
	getWeekdayTehran,
	jalaliMonthName,
	jalaliToHijri,
	jalaliToSeason,
	seasonName,
	weekStartNumber,
} from "..";

//? --- Core ---
const persian = new PersianCalendar();
const gregorian = new GregorianCalendar();

function weekNumber(
	targetDate: CalendarDate,
	firstDayOfYear: CalendarDate,
	weekStart: TWeekStart,
): number {
	const diffInDays = calendarDaysBetween(firstDayOfYear, targetDate);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (firstWeekday - weekStartNumber(weekStart) + 7) % 7;
	return Math.ceil((diffInDays + offset + 1) / 7);
}

//? --- Main ---
export function checkValidJalali(jy: number, jm: number, jd: number): boolean {
	if (jy < 1) return false;

	if (jm < 1 || jm > 12 || jd < 1) return false;

	try {
		const maxDays = persian.getDaysInMonth(new CalendarDate(persian, jy, jm, 1));
		return jd <= maxDays;
	} catch {
		return false;
	}
}

export function checkKabiseh(jy: number): boolean {
	return persian.getDaysInMonth(new CalendarDate(persian, jy, 12, 1)) === 30;
}

export function dateToJalali(date: CalendarDate): TJalali {
	const jcd = toCalendar(date, persian);
	return { jy: jcd.year, jm: jcd.month, jd: jcd.day };
}

export function jalaliToCalendarDate(jy: number, jm: number, jd: number): CalendarDate {
	return toCalendar(new CalendarDate(persian, jy, jm, jd), gregorian);
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): TGregorian {
	const gcd = toCalendar(new CalendarDate(persian, jy, jm, jd), gregorian);
	return { gy: gcd.year, gm: gcd.month, gd: gcd.day };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): TJalali {
	const jcd = toCalendar(new CalendarDate(gy, gm, gd), persian);
	return { jy: jcd.year, jm: jcd.month, jd: jcd.day };
}

export function jalaliMonthLength(jy: number, jm: number): number {
	return persian.getDaysInMonth(new CalendarDate(persian, jy, jm, 1));
}

export function getDaysInJalaliYear(jy: number): number {
	let totalDays = 0;
	for (let month = 1; month <= 12; month++) {
		totalDays += persian.getDaysInMonth(new CalendarDate(persian, jy, month, 1));
	}
	return totalDays;
}

export function dateToJWeekNumber(date: CalendarDate, weekStart: TWeekStart = "sat"): number {
	const { jy } = dateToJalali(date);
	const next = jalaliToStartDayOfWeek({ jYear: jy + 1, jWeekNumber: 1 }, weekStart);
	// Keep the calendar year in note names when the final week rolls over to W1.
	if (calendarDaysBetween(jalaliToCalendarDate(next.jy, next.jm, next.jd), date) >= 0) return 1;
	return weekNumber(date, jalaliToCalendarDate(jy, 1, 1), weekStart);
}

export function jalaliToJWeekNumber(
	jy: number,
	jm: number,
	jd: number,
	weekStart: TWeekStart = "sat",
): number {
	return dateToJWeekNumber(jalaliToCalendarDate(jy, jm, jd), weekStart);
}

export function jalaliToStartWeek(
	jy: number,
	jWeekNumber: number = 1,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const firstDayOfYear = jalaliToCalendarDate(jy, 1, 1);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const { gy, gm, gd } = jalaliToGregorian(jy, 1, 1);
	const firstGCD = new CalendarDate(gy, gm, gd);
	const targetGCD = firstGCD.add({ days: offset + (jWeekNumber - 1) * 7 });
	const targetJCD = toCalendar(targetGCD, persian);

	return {
		jy: targetJCD.year,
		jm: targetJCD.month,
		jd: targetJCD.day,
		gy: targetGCD.year,
		gm: targetGCD.month,
		gd: targetGCD.day,
	};
}

export function jalaliToEndWeek(
	jy: number,
	jWeekNumber: number = 1,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const { gy, gm, gd } = jalaliToStartWeek(jy, jWeekNumber, weekStart);

	const startGCD = new CalendarDate(gy, gm, gd);
	const endGCD = startGCD.add({ days: 6 });
	const endJCD = toCalendar(endGCD, persian);

	return {
		jy: endJCD.year,
		jm: endJCD.month,
		jd: endJCD.day,
		gy: endGCD.year,
		gm: endGCD.month,
		gd: endGCD.day,
	};
}

// occurrence of weekStart in a jalali year belong to the previous year's last week.
export function jalaliToJWeekNumberFromFirstWeekStart(
	date: CalendarDate,
	weekStart: TWeekStart = "sat",
): { jy: number; weekNumber: number } {
	const { jy } = dateToJalali(date);

	const { gy, gm, gd } = jalaliToStartWeek(jy, 1, weekStart);
	const diffInDays = calendarDaysBetween(new CalendarDate(gy, gm, gd), date);

	if (diffInDays >= 0) {
		return { jy, weekNumber: Math.floor(diffInDays / 7) + 1 };
	}

	const previousYear = jy - 1;
	const previousStart = jalaliToStartWeek(previousYear, 1, weekStart);
	const previousDiffInDays = calendarDaysBetween(
		new CalendarDate(previousStart.gy, previousStart.gm, previousStart.gd),
		date,
	);

	return {
		jy: previousYear,
		weekNumber: Math.floor(previousDiffInDays / 7) + 1,
	};
}

export function jalaliToStartDayOfWeek(
	{ jYear, jWeekNumber }: TGetJalaliDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const firstDayOfYear = jalaliToCalendarDate(jYear, 1, 1);
	const firstDayWeekday = getWeekdayTehran(firstDayOfYear);
	const weekStartNum = weekStartNumber(weekStart);

	let daysToAdd = weekStartNum - firstDayWeekday;
	if (daysToAdd < 0) daysToAdd += 7;
	if (daysToAdd > 0) daysToAdd -= 7;

	const { gy, gm, gd } = jalaliToGregorian(jYear, 1, 1);
	const firstGCD = new CalendarDate(gy, gm, gd);
	const targetGCD = firstGCD.add({ days: daysToAdd + (jWeekNumber - 1) * 7 });
	const targetJCD = toCalendar(targetGCD, persian);

	return {
		jy: targetJCD.year,
		jm: targetJCD.month,
		jd: targetJCD.day,
		gy: targetGCD.year,
		gm: targetGCD.month,
		gd: targetGCD.day,
	};
}

export function jalaliToEndDayOfWeek(
	{ jYear, jWeekNumber }: TGetJalaliDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const { gy, gm, gd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber }, weekStart);

	const startGCD = new CalendarDate(gy, gm, gd);
	const endGCD = startGCD.add({ days: 6 });
	const endJCD = toCalendar(endGCD, persian);

	return {
		jy: endJCD.year,
		jm: endJCD.month,
		jd: endJCD.day,
		gy: endGCD.year,
		gm: endGCD.month,
		gd: endGCD.day,
	};
}

export function dateToMonthName(date: CalendarDate) {
	const { jm } = dateToJalali(date);
	return jalaliMonthName(jm);
}

export function dateToSeasonName(date: CalendarDate) {
	const { jm } = dateToJalali(date);
	return seasonName(jalaliToSeason(jm));
}

export function dateToStartDayOfJMonthCalendarDate(date: CalendarDate): CalendarDate {
	const { jy, jm } = dateToJalali(date);
	return jalaliToCalendarDate(jy, jm, 1);
}

export function dateToEndDayOfJMonthCalendarDate(date: CalendarDate): CalendarDate {
	const { jy, jm } = dateToJalali(date);
	return jalaliToCalendarDate(jy, jm, jalaliMonthLength(jy, jm));
}

export function dateToStartDayOfSeasonCalendarDate(date: CalendarDate): CalendarDate {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	return jalaliToCalendarDate(jy, 3 * (season - 1) + 1, 1);
}

export function dateToEndDayOfSeasonCalendarDate(date: CalendarDate): CalendarDate {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	const lastMonthOfSeason = 3 * season;
	return jalaliToCalendarDate(jy, lastMonthOfSeason, jalaliMonthLength(jy, lastMonthOfSeason));
}

export function dateToDayOfMonth(date: CalendarDate): number {
	return dateToJalali(date).jd;
}

export function dateToDaysPassedJYear(date: CalendarDate): number {
	const { jy, jm, jd } = dateToJalali(date);
	let daysPassed = 0;
	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month);
	}
	return daysPassed + jd;
}

export function dateToDaysRemainingJYear(date: CalendarDate): number {
	return getDaysInJalaliYear(dateToJalali(date).jy) - dateToDaysPassedJYear(date);
}

export function dateToDaysPassedSeason(date: CalendarDate): number {
	const { jy, jm, jd } = dateToJalali(date);
	const startMonth = (jalaliToSeason(jm) - 1) * 3 + 1;
	let daysPassed = 0;
	for (let m = startMonth; m < jm; m++) {
		daysPassed += jalaliMonthLength(jy, m);
	}
	return daysPassed + jd;
}

export function dateToDaysRemainingSeason(date: CalendarDate): number {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	const startMonth = (season - 1) * 3 + 1;
	const endMonth = startMonth + 2;

	let seasonLength = 0;
	for (let m = startMonth; m <= endMonth; m++) {
		seasonLength += jalaliMonthLength(jy, m);
	}

	return seasonLength - dateToDaysPassedSeason(date);
}

export function dateToDaysPassedJMonth(date: CalendarDate): number {
	return dateToJalali(date).jd;
}

export function dateToDaysRemainingJMonth(date: CalendarDate): number {
	const { jy, jm, jd } = dateToJalali(date);
	return jalaliMonthLength(jy, jm) - jd;
}

export function jalaliMonthToGregorianRange(jYear: number, jMonth: number) {
	const firstGDayOfJMonth = jalaliToGregorian(jYear, jMonth, 1);
	const lastGDayOfJMonth = jalaliToGregorian(jYear, jMonth, jalaliMonthLength(jYear, jMonth));

	return { firstDay: firstGDayOfJMonth, lastDay: lastGDayOfJMonth };
}

export function jalaliMonthToHijriRange(
	jYear: number,
	jMonth: number,
	options?: {
		base?: THijriBase;
	},
) {
	const base = options?.base ?? "iran";

	const firstGDayOfJMonth = jalaliToHijri(jYear, jMonth, 1, { base });
	const lastGDayOfJMonth = jalaliToHijri(jYear, jMonth, jalaliMonthLength(jYear, jMonth), { base });

	return { firstDay: firstGDayOfJMonth, lastDay: lastGDayOfJMonth };
}
