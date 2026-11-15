import type { CalendarDate } from "@internationalized/date";
import type { TDateFormat } from "src/types";
import { dashToCalendarDate, dateToDash } from "src/utils/dashUtils";
import {
	checkKabiseh,
	dateToJalali,
	gregorianToCalendarDate,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { extractYearFormat, isDayFormat, isYearFormat } from "src/utils/formatters";

export function dashToStartDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);
		const startDate = jalaliToCalendarDate(jy, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		const startDate =
			year >= 1800 ? gregorianToCalendarDate(year, 1, 1) : jalaliToCalendarDate(year, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);

		const endDay = checkKabiseh(jy) ? 30 : 29;
		const endDate = jalaliToCalendarDate(jy, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		if (year >= 1800) {
			const endDate = gregorianToCalendarDate(year, 12, 31);
			return dateToDash(endDate, dateFormat);
		}

		const endDay = checkKabiseh(year) ? 30 : 29;
		const endDate = jalaliToCalendarDate(year, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	return null;
}

export function dateToJYearDash(date: CalendarDate) {
	const { jy } = dateToJalali(date);
	return String(jy);
}
