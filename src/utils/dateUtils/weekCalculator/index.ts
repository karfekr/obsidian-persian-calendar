import type { TGregorian, TJalali, TWeekCalculationMode, TWeekStart } from "src/types";

import {
	dateToGregorian,
	dateToGWeekNumber,
	gregorianToEndDayOfWeek,
	gregorianToEndWeek,
	gregorianToGWeekNumberFromFirstWeekStart,
	gregorianToStartDayOfWeek,
	gregorianToStartWeek,
} from "../gregorianUtils";
import {
	dateToJalali,
	dateToJWeekNumber,
	gregorianToJalali,
	jalaliToEndDayOfWeek,
	jalaliToEndWeek,
	jalaliToJWeekNumberFromFirstWeekStart,
	jalaliToStartDayOfWeek,
	jalaliToStartWeek,
} from "../jalaliUtils";

export type TWeekCalculator = {
	getWeekNumber(date: Date, weekStart?: TWeekStart): { jy: number; weekNumber: number };
	getStartOfWeek(jYear: number, jWeekNumber: number, weekStart?: TWeekStart): TJalali & TGregorian;
	getEndOfWeek(jYear: number, jWeekNumber: number, weekStart?: TWeekStart): TJalali & TGregorian;
};

function toJalaliAndGregorian({ gy, gm, gd }: TGregorian): TJalali & TGregorian {
	const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
	return { jy, jm, jd, gy, gm, gd };
}

const jalaliFirstDayOfYearCalculator: TWeekCalculator = {
	getWeekNumber(date, weekStart = "sat") {
		const { jy } = dateToJalali(date);
		return { jy, weekNumber: dateToJWeekNumber(date, weekStart) };
	},
	getStartOfWeek(jYear, jWeekNumber, weekStart = "sat") {
		return jalaliToStartDayOfWeek({ jYear, jWeekNumber }, weekStart);
	},
	getEndOfWeek(jYear, jWeekNumber, weekStart = "sat") {
		return jalaliToEndDayOfWeek({ jYear, jWeekNumber }, weekStart);
	},
};

const jalaliFirstWeekStartCalculator: TWeekCalculator = {
	getWeekNumber(date, weekStart = "sat") {
		return jalaliToJWeekNumberFromFirstWeekStart(date, weekStart);
	},
	getStartOfWeek(jYear, jWeekNumber, weekStart = "sat") {
		return jalaliToStartWeek(jYear, jWeekNumber, weekStart);
	},
	getEndOfWeek(jYear, jWeekNumber, weekStart = "sat") {
		return jalaliToEndWeek(jYear, jWeekNumber, weekStart);
	},
};

const gregorianFirstDayOfYearCalculator: TWeekCalculator = {
	getWeekNumber(date, weekStart = "sat") {
		const { gy } = dateToGregorian(date);
		return { jy: gy, weekNumber: dateToGWeekNumber(date, weekStart) };
	},
	getStartOfWeek(gYear, gWeekNumber, weekStart = "sat") {
		return toJalaliAndGregorian(gregorianToStartDayOfWeek({ gYear, gWeekNumber }, weekStart));
	},
	getEndOfWeek(gYear, gWeekNumber, weekStart = "sat") {
		return toJalaliAndGregorian(gregorianToEndDayOfWeek({ gYear, gWeekNumber }, weekStart));
	},
};

const gregorianFirstWeekStartCalculator: TWeekCalculator = {
	getWeekNumber(date, weekStart = "sat") {
		const { gy, weekNumber } = gregorianToGWeekNumberFromFirstWeekStart(date, weekStart);
		return { jy: gy, weekNumber };
	},
	getStartOfWeek(gYear, gWeekNumber, weekStart = "sat") {
		return toJalaliAndGregorian(gregorianToStartWeek(gYear, gWeekNumber, weekStart));
	},
	getEndOfWeek(gYear, gWeekNumber, weekStart = "sat") {
		return toJalaliAndGregorian(gregorianToEndWeek(gYear, gWeekNumber, weekStart));
	},
};

const calculatorsByMode: Record<TWeekCalculationMode, TWeekCalculator> = {
	"jalali-first-day-of-year": jalaliFirstDayOfYearCalculator,
	"jalali-first-week-start": jalaliFirstWeekStartCalculator,
	"gregorian-first-day-of-year": gregorianFirstDayOfYearCalculator,
	"gregorian-first-week-start": gregorianFirstWeekStartCalculator,
};

export function getWeekStartCalculator(
	mode: TWeekCalculationMode = "jalali-first-day-of-year",
): TWeekCalculator {
	return calculatorsByMode[mode] ?? jalaliFirstDayOfYearCalculator;
}
