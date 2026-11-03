import type { TDateFormat } from "src/types";
import { dashToDate, dateToDash } from "src/utils/dashUtils";
import { checkKabiseh, dateToJalali, gregorianToDate, jalaliToDate } from "src/utils/dateUtils";
import { extractYearFormat, isDayFormat, isYearFormat } from "src/utils/formatters";

export function dashToStartDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);
		const startDate = jalaliToDate(jy, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		const startDate = year >= 1800 ? gregorianToDate(year, 1, 1) : jalaliToDate(year, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);

		const endDay = checkKabiseh(jy) ? 30 : 29;
		const endDate = jalaliToDate(jy, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		if (year >= 1800) {
			const endDate = gregorianToDate(year, 12, 31);
			return dateToDash(endDate, dateFormat);
		}

		const endDay = checkKabiseh(year) ? 30 : 29;
		const endDate = jalaliToDate(year, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	return null;
}

export function dateToJYearDash(date: Date) {
	const { jy } = dateToJalali(date);
	return String(jy);
}
