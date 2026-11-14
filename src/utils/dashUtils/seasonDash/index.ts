import type { CalendarDate } from "@internationalized/date";
import type { TDateFormat } from "src/types";
import { dashToCalendarDate, dateToDash } from "src/utils/dashUtils";
import {
	dateToEndDayOfSeasonCalendarDate,
	dateToJalali,
	dateToSeasonName,
	dateToStartDayOfSeasonCalendarDate,
	jalaliToCalendarDate,
	jalaliToSeason,
	seasonName,
} from "src/utils/dateUtils";
import {
	extractMonthFormat,
	extractSeasonFormat,
	isDayFormat,
	isMonthFormat,
	isSeasonFormat,
	toSeasonFormat,
} from "src/utils/formatters";

export function dateToSeasonDash(date: CalendarDate, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	return toSeasonFormat(jy, season, { separator });
}

export function dashToSeasonName(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToSeasonName(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const season = jalaliToSeason(monthProps.month);
		return seasonName(season);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		return seasonName(seasonProps.season);
	}

	return null;
}

export function dashToSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToSeasonDash(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const season = jalaliToSeason(monthProps.month);

		return toSeasonFormat(monthProps.year, season);
	}

	if (isSeasonFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToStartDayOfSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		const startDayOfSeasonDate = dateToStartDayOfSeasonCalendarDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date = jalaliToCalendarDate(monthProps.year, monthProps.month, 1);

		const startDayOfSeasonDate = dateToStartDayOfSeasonCalendarDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		const firstMonthOfSeason = 3 * (seasonProps.season - 1) + 1;
		const date = jalaliToCalendarDate(seasonProps.year, firstMonthOfSeason, 1);

		const startDayOfSeasonDate = dateToStartDayOfSeasonCalendarDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToCalendarDate(dashDate, dateFormat);
		if (!date) return null;

		const endDayOfSeasonDate = dateToEndDayOfSeasonCalendarDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date = jalaliToCalendarDate(monthProps.year, monthProps.month, 1);

		const endDayOfSeasonDate = dateToEndDayOfSeasonCalendarDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		const lastMonthOfSeason = 3 * seasonProps.season;
		const date = jalaliToCalendarDate(seasonProps.year, lastMonthOfSeason, 1);

		const endDayOfSeasonDate = dateToEndDayOfSeasonCalendarDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	return null;
}
