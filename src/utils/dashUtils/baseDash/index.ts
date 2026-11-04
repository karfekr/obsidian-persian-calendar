import type { TDateFormat, TJalali } from "src/types";
import {
	checkValidJalali,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianToDate,
	gregorianToJalali,
	jalaliToDate,
	jalaliToGregorian,
} from "src/utils/dateUtils";
import { extractDayFormat, isDayFormat, toDayFormat } from "src/utils/formatters";

export function dashToDate(dashDate: string, dateFormat?: TDateFormat): Date | null {
	if (!isDayFormat(dashDate)) return null;

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	if (dayProps.year >= 1800 && dayProps.year <= 2200) {
		return gregorianDashToDate(dashDate);
	}
	if (dayProps.year >= 1200 && dayProps.year < 1700) {
		return jalaliDashToDate(dashDate);
	}

	if (dateFormat === "jalali") {
		return jalaliDashToDate(dashDate);
	}

	return gregorianDashToDate(dashDate);
}

export function dateToDash(
	date: Date,
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

	const date = gregorianToDate(gy, gm, gd);
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

export function gregorianDashToDate(dashDate: string): Date | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;

	const date = gregorianToDate(gy, gm, gd);
	if (date.getUTCMonth() !== gm - 1 || date.getUTCDate() !== gd) {
		return null;
	}

	return date;
}

export function jalaliDashToDate(dashDate: string): Date | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	if (!checkValidJalali(jy, jm, jd)) return null;

	// Match jalaliToDate / todayTehran (UTC noon). Local midnight breaks week day-math on Asia/Tehran.
	return jalaliToDate(jy, jm, jd);
}
