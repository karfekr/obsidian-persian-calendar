import type { TJalali, TWeekCalculationMode, TWeekStart } from "src/types";
import {
	addCalendarDays,
	dateToJalali,
	getWeekdayTehran,
	getWeekStartCalculator,
	jalaliMonthLength,
	jalaliToCalendarDate,
	todayTehran,
} from "src/utils/dateUtils";

export default class CalendarState {
	public jYearState: number;
	public jMonthState: number;
	public activeJDate: TJalali | null = null;

	constructor(initial?: { jYear: number; jMonth: number }) {
		if (initial) {
			this.jYearState = initial.jYear;
			this.jMonthState = initial.jMonth;
		} else {
			const today = dateToJalali(todayTehran());

			this.jYearState = today.jy;
			this.jMonthState = today.jm;
		}
	}

	public setJState(jYearState: number, jMonthState: number) {
		this.jYearState = jYearState;
		this.jMonthState = jMonthState;
	}

	public getJState() {
		return {
			jYearState: this.jYearState,
			jMonthState: this.jMonthState,
		};
	}

	public setActiveJDate(date: TJalali | null) {
		this.activeJDate = date;
	}

	public getActiveJDate(): TJalali | null {
		return this.activeJDate;
	}

	public changeJMonthState(offset: number) {
		const totalMonths = this.jYearState * 12 + (this.jMonthState - 1) + offset;

		this.jYearState = Math.floor(totalMonths / 12);
		this.jMonthState = (totalMonths % 12) + 1;
	}

	public calculateDaysFromPreviousMonth(firstDayOfWeek: number) {
		const previousMonth = this.jMonthState === 1 ? 12 : this.jMonthState - 1;
		const previousYear = this.jMonthState === 1 ? this.jYearState - 1 : this.jYearState;

		const lastDayOfPreviousMonth = jalaliMonthLength(previousYear, previousMonth);
		const daysFromPrevMonth: number[] = [];

		const daysToInclude = firstDayOfWeek;

		for (let i = lastDayOfPreviousMonth - daysToInclude + 1; i <= lastDayOfPreviousMonth; i++) {
			daysFromPrevMonth.push(i);
		}

		return daysFromPrevMonth;
	}

	public calculateDaysFromNextMonth(
		firstDayOfWeek: number,
		daysInMonth: number,
		totalCells: number = 42,
	) {
		const daysFromPrevCount = firstDayOfWeek;

		const totalDaysInGrid = daysFromPrevCount + daysInMonth;
		const daysToInclude = totalCells - totalDaysInGrid;

		const daysFromNextMonth: number[] = [];

		for (let i = 1; i <= daysToInclude; i++) {
			daysFromNextMonth.push(i);
		}

		return daysFromNextMonth;
	}

	public getWeeksCountForMonth(jy: number, jm: number): number {
		const daysInMonth = jalaliMonthLength(jy, jm);
		const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jy, jm);

		const daysFromPrevMonth = this.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
		const daysFromPrevMonthCount = daysFromPrevMonth.length;

		const totalDaysInGrid = daysFromPrevMonthCount + daysInMonth;

		const weeks = Math.ceil(totalDaysInGrid / 7);

		return weeks;
	}

	public calculateFirstDayOfWeekIndex(jy: number, jm: number): number {
		const dayOfWeek = getWeekdayTehran(jalaliToCalendarDate(jy, jm, 1));
		const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

		return adjustedDayOfWeek;
	}

	public getWeekNumbersForMonth(
		jy: number,
		jm: number,
		mode: TWeekCalculationMode = "jalali-first-day-of-year",
		weekStart: TWeekStart = "sat",
	): { jy: number; weekNumber: number }[] {
		const calculator = getWeekStartCalculator(mode);
		const weeks = this.getWeeksCountForMonth(jy, jm);

		const startOfMonthDate = jalaliToCalendarDate(jy, jm, 1);
		const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jy, jm);

		const weekNumbers: { jy: number; weekNumber: number }[] = [];

		for (let i = 0; i < weeks; i++) {
			// Use a day in the displayed month for a row shared by two calendar years.
			const offset = Math.max(0, i * 7 - firstDayOfWeekIndex);
			weekNumbers.push(
				calculator.getWeekNumber(addCalendarDays(startOfMonthDate, offset), weekStart),
			);
		}

		return weekNumbers;
	}
}
