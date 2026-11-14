import type { CalendarDate } from "@internationalized/date";
import { GREGORIAN_MONTHS_NAME, HIJRI_MONTHS_NAME } from "src/constants";
import type { TDateFormat, THijriBase, TLocale } from "src/types";
import { dashToCalendarDate, dateToDash } from "src/utils/dashUtils";
import {
	dateToEndDayOfJMonthCalendarDate,
	dateToJalali,
	dateToMonthName,
	dateToStartDayOfJMonthCalendarDate,
	gregorianMonthLength,
	gregorianToCalendarDate,
	jalaliMonthLength,
	jalaliMonthToGregorianRange,
	jalaliMonthToHijriRange,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import {
	extractMonthFormat,
	isDayFormat,
	isMonthFormat,
	toArNumber,
	toMonthFormat,
} from "src/utils/formatters";

export function dateToJMonthDash(date: CalendarDate, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);

	return toMonthFormat(jy, jm, { separator });
}

export function dashToJMonthDash(dashDate: string, dateFormat?: TDateFormat) {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy, jm } = dateToJalali(date);

		return toMonthFormat(jy, jm);
	}

	if (isMonthFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToJMonthName(dashDate: string, dateFormat?: TDateFormat) {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToMonthName(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date =
			monthProps.year >= 1800
				? gregorianToCalendarDate(monthProps.year, monthProps.month, 1)
				: jalaliToCalendarDate(monthProps.year, monthProps.month, 1);
		return dateToMonthName(date);
	}

	return null;
}

export function dashToStartDayOfJMonthDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const currentDate = dashToCalendarDate(dashDate, dateFormat);
		if (!currentDate) return null;

		const startDate = dateToStartDayOfJMonthCalendarDate(currentDate);
		return dateToDash(startDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const startDate =
			monthProps.year >= 1800
				? gregorianToCalendarDate(monthProps.year, monthProps.month, 1)
				: jalaliToCalendarDate(monthProps.year, monthProps.month, 1);
		return dateToDash(startDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfJMonthDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const currentDate = dashToCalendarDate(dashDate, dateFormat);
		if (!currentDate) return null;

		const endDate = dateToEndDayOfJMonthCalendarDate(currentDate);
		return dateToDash(endDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		if (monthProps.year >= 1800) {
			const endDay = gregorianMonthLength(monthProps.year, monthProps.month);
			const endDate = gregorianToCalendarDate(monthProps.year, monthProps.month, endDay);
			return dateToDash(endDate, dateFormat);
		}

		const day = jalaliMonthLength(monthProps.year, monthProps.month);

		const endDate = jalaliToCalendarDate(monthProps.year, monthProps.month, day);
		return dateToDash(endDate, dateFormat);
	}

	return null;
}

export function jalaliMonthToRangeDash(
	jy: number,
	jm: number,
	option: { dateFormat: Exclude<TDateFormat, "jalali">; local: TLocale; hijriBase?: THijriBase },
) {
	const { dateFormat, local, hijriBase } = option;

	let first: {
		year: number | string;
		month: number;
		monthName: string;
	};

	let last: {
		year: number | string;
		month: number;
		monthName: string;
	};

	if (dateFormat === "hijri") {
		const { firstDay, lastDay } = jalaliMonthToHijriRange(jy, jm, { base: hijriBase });

		first = {
			year: local === "fa" ? toArNumber(firstDay.hy) : firstDay.hy,
			month: firstDay.hm,
			monthName: HIJRI_MONTHS_NAME[local][firstDay.hm],
		};

		last = {
			year: local === "fa" ? toArNumber(firstDay.hy) : firstDay.hy,
			month: lastDay.hm,
			monthName: HIJRI_MONTHS_NAME[local][lastDay.hm],
		};
	} else {
		const { firstDay, lastDay } = jalaliMonthToGregorianRange(jy, jm);

		first = {
			year: firstDay.gy,
			month: firstDay.gm,
			monthName: GREGORIAN_MONTHS_NAME[local][firstDay.gm],
		};

		last = {
			year: lastDay.gy,
			month: lastDay.gm,
			monthName: GREGORIAN_MONTHS_NAME[local][lastDay.gm],
		};
	}

	if (first.month === last.month) {
		return `${first.monthName} ${first.year}`;
	}
	return `${first.monthName} - ${last.monthName} ${last.year}`;
}
