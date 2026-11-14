import type { AdapterType } from "persian-holidays";
import {
	getWeekdayTehran,
	gregorianMonthLength,
	gregorianToCalendarDate,
	hijriMonthLength,
	hijriToCalendarDate,
	jalaliMonthLength,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";

export function setDefaultEventAdapter(): AdapterType {
	return {
		firstWeekdayOfMonth(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return getWeekdayTehran(jalaliToCalendarDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToCalendarDate(year, month, 1, { base: "iran" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToCalendarDate(year, month, 1));
			}
		},
		monthLength(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return jalaliMonthLength(year, month);
				case "hijri":
					return hijriMonthLength(year, month, { base: "iran" });
				case "gregorian":
					return gregorianMonthLength(year, month);
			}
		},
	};
}

export function setUmalquraEventAdapter(): AdapterType {
	return {
		firstWeekdayOfMonth(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return getWeekdayTehran(jalaliToCalendarDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToCalendarDate(year, month, 1, { base: "umalqura" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToCalendarDate(year, month, 1));
			}
		},

		monthLength(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return getWeekdayTehran(jalaliToCalendarDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToCalendarDate(year, month, 1, { base: "umalqura" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToCalendarDate(year, month, 1));
			}
		},
	};
}
