import type { TDateFormat, TWeekCalculationMode, TWeekStart } from "src/types";
import { dashToDate, dateToDash } from "src/utils/dashUtils";
import { getWeekStartCalculator, jalaliToDate } from "src/utils/dateUtils";
import {
	extractWeekFormat,
	isDayFormat,
	isWeekFormat,
	toDayFormat,
	toWeekFormat,
} from "src/utils/formatters";

type TWeekDashOption = {
	separator?: string;
	mode?: TWeekCalculationMode;
	weekStart?: TWeekStart;
};

export function dateToJWeekDash(
	date: Date,
	weekStart: TWeekStart = "sat",
	option?: TWeekDashOption,
) {
	const separator = option?.separator ?? "-";
	const calculator = getWeekStartCalculator(option?.mode);

	const { jy, weekNumber } = calculator.getWeekNumber(date, weekStart);

	return toWeekFormat(jy, weekNumber, { separator });
}

export function dashToJWeekDash(
	dashDate: string,
	dateFormat?: TDateFormat,
	option?: Omit<TWeekDashOption, "separator">,
): string | null {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToJWeekDash(date, option?.weekStart, { mode: option?.mode });
	}

	if (isWeekFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToStartDayOfWeekDash(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: TWeekDashOption,
) {
	const separator = option?.separator ?? "-";
	const weekStart = option?.weekStart ?? "sat";
	const calculator = getWeekStartCalculator(option?.mode);

	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return;

		const { jy: jYear, weekNumber: jWeekNumber } = calculator.getWeekNumber(date, weekStart);
		const { jy, jm, jd, gy, gm, gd } = calculator.getStartOfWeek(jYear, jWeekNumber, weekStart);

		if (dateFormat === "jalali") {
			return toDayFormat(jy, jm, jd, { separator });
		}

		return toDayFormat(gy, gm, gd, { separator });
	}

	if (isWeekFormat(dashDate)) {
		const weekProps = extractWeekFormat(dashDate);
		if (!weekProps) return;

		const { jy, jm, jd } = calculator.getStartOfWeek(weekProps.year, weekProps.week, weekStart);
		const date = jalaliToDate(jy, jm, jd);

		return dateToDash(date, dateFormat);
	}

	return null;
}

export function dashToEndDayOfWeekDash(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: TWeekDashOption,
) {
	const separator = option?.separator ?? "-";
	const weekStart = option?.weekStart ?? "sat";
	const calculator = getWeekStartCalculator(option?.mode);

	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return;

		const { jy: jYear, weekNumber: jWeekNumber } = calculator.getWeekNumber(date, weekStart);
		const { jy, jm, jd, gy, gm, gd } = calculator.getEndOfWeek(jYear, jWeekNumber, weekStart);

		if (dateFormat === "jalali") {
			return toDayFormat(jy, jm, jd, { separator });
		}

		return toDayFormat(gy, gm, gd, { separator });
	}

	if (isWeekFormat(dashDate)) {
		const weekProps = extractWeekFormat(dashDate);
		if (!weekProps) return;

		const { jy, jm, jd } = calculator.getEndOfWeek(weekProps.year, weekProps.week, weekStart);
		const date = jalaliToDate(jy, jm, jd);

		return dateToDash(date, dateFormat);
	}

	return null;
}
