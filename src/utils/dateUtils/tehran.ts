import type { CalendarDate, ZonedDateTime } from "@internationalized/date";
import {
	fromDate,
	now,
	Time,
	toCalendarDate,
	toCalendarDateTime,
	today,
} from "@internationalized/date";

export const TEHRAN_TZ = "Asia/Tehran";

export function todayTehran(): CalendarDate {
	return today(TEHRAN_TZ);
}

export function nowTehran(): ZonedDateTime {
	return now(TEHRAN_TZ);
}

export function calendarDateFromDate(date: Date): CalendarDate {
	return toCalendarDate(fromDate(date, TEHRAN_TZ));
}

export function calendarDateToDate(date: CalendarDate): Date {
	// Preserve UTC-noon timestamps returned by the plugin's existing public conversion API.
	return toCalendarDateTime(date, new Time(12)).toDate("UTC");
}
