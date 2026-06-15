import { type AdapterType } from "persian-holidays";
import {
	jalaliMonthLength,
	hijriMonthLength,
	gregorianMonthLength,
	jalaliToDate,
	getWeekdayTehran,
	hijriToDate,
	gregorianToDate,
} from "src/utils/dateUtils";

export function createEventAdapter(): AdapterType {
	return {
		firstWeekdayOfMonth(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return getWeekdayTehran(jalaliToDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToDate(year, month, 1, { base: "iran" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToDate(year, month, 1));
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
					return getWeekdayTehran(jalaliToDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToDate(year, month, 1, { base: "umalqura" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToDate(year, month, 1));
			}
		},

		monthLength(calendar, year, month) {
			switch (calendar) {
				case "jalali":
					return getWeekdayTehran(jalaliToDate(year, month, 1));
				case "hijri":
					return getWeekdayTehran(hijriToDate(year, month, 1, { base: "umalqura" }));
				case "gregorian":
					return getWeekdayTehran(gregorianToDate(year, month, 1));
			}
		},
	};
}
