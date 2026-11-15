import type { CalendarDate } from "@internationalized/date";
import type { TDateFormat, TJalali } from "src/types";
import {
	checkValidJalali,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianToCalendarDate,
	gregorianToJalali,
	jalaliToCalendarDate,
	jalaliToGregorian,
} from "src/utils/dateUtils";
import { extractDayFormat, isDayFormat, toDayFormat } from "src/utils/formatters";

export function dashToCalendarDate(
	dashDate: string,
	dateFormat?: TDateFormat,
): CalendarDate | null {
	if (!isDayFormat(dashDate)) return null;

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	if (dayProps.year >= 1800 && dayProps.year <= 2200) {
		return gregorianDashToCalendarDate(dashDate);
	}
	if (dayProps.year >= 1200 && dayProps.year < 1700) {
		return jalaliDashToCalendarDate(dashDate);
	}

	if (dateFormat === "jalali") {
		return jalaliDashToCalendarDate(dashDate);
	}

	return gregorianDashToCalendarDate(dashDate);
}

export function dateToDash(
	date: CalendarDate,
	dateFormat: TDateFormat,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	if (dateFormat === "jalali") {
		const { jy, jm, jd } = dateToJalali(date);
		return toDayFormat(jy, jm, jd, { separator });
	}

	if (dateFormat === "hijri") {
		const { hy, hm, hd } = dateToHijri(date);
		return toDayFormat(hy, hm, hd, { separator });
	}

	const { gy, gm, gd } = dateToGregorian(date);
	return toDayFormat(gy, gm, gd, { separator });
}

export function gregorianDashToJalaliDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	const date = gregorianToCalendarDate(gy, gm, gd);
	const { jy, jm, jd } = dateToJalali(date);

	return toDayFormat(jy, jm, jd, { separator });
}

export function jalaliDashToGregorianDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	try {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		return toDayFormat(gy, gm, gd, { separator });
	} catch {
		return null;
	}
}

export function jalaliDashToJalali(dashDate: string): TJalali | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	if (!checkValidJalali(jy, jm, jd)) return null;

	return { jy, jm, jd };
}

export function gregorianDashToJalali(dashDate: string): TJalali | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	return gregorianToJalali(gy, gm, gd);
}

export function gregorianDashToCalendarDate(dashDate: string): CalendarDate | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;

	const date = gregorianToCalendarDate(gy, gm, gd);
	if (date.month !== gm || date.day !== gd) {
		return null;
	}

	return date;
}

export function jalaliDashToCalendarDate(dashDate: string): CalendarDate | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	if (!checkValidJalali(jy, jm, jd)) return null;

	return jalaliToCalendarDate(jy, jm, jd);
}
