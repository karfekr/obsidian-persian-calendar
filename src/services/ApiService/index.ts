import type { THijriBase } from "src/types";
import {
	calendarDateFromDate,
	calendarDateToDate,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianToCalendarDate,
	gregorianToHijri,
	gregorianToJalali,
	hijriMonthLength,
	hijriToCalendarDate,
	hijriToGregorian,
	hijriToJalali,
	jalaliMonthLength,
	jalaliMonthName,
	jalaliToCalendarDate,
	jalaliToGregorian,
	jalaliToHijri,
	seasonName,
} from "src/utils/dateUtils";
import { checkHoliday, dateToEvents } from "src/utils/eventUtils";
import { toEnNumber, toFaNumber } from "src/utils/formatters";

export default class ApiService {
	build() {
		return Object.freeze({
			toEnNumber,
			toFaNumber,
			dateToGregorian: (date: Date) => dateToGregorian(calendarDateFromDate(date)),
			gregorianToDate: (gy: number, gm: number, gd: number) =>
				calendarDateToDate(gregorianToCalendarDate(gy, gm, gd)),
			gregorianToJalali,
			gregorianToHijri,
			dateToJalali: (date: Date) => dateToJalali(calendarDateFromDate(date)),
			jalaliToDate: (jy: number, jm: number, jd: number) =>
				calendarDateToDate(jalaliToCalendarDate(jy, jm, jd)),
			jalaliToGregorian,
			jalaliToHijri,
			jalaliMonthLength,
			dateToHijri: (date: Date, options?: { base?: THijriBase }) =>
				dateToHijri(calendarDateFromDate(date), options),
			hijriToDate: (hy: number, hm: number, hd: number, options?: { base?: THijriBase }) =>
				calendarDateToDate(hijriToCalendarDate(hy, hm, hd, options)),
			hijriToGregorian,
			hijriToJalali,
			hijriMonthLength,
			jalaliMonthName,
			seasonName,
			checkHoliday: (date: Date) => checkHoliday(calendarDateFromDate(date)),
			dateToEvents: (date: Date, options?: { base?: THijriBase }) =>
				dateToEvents(calendarDateFromDate(date), {
					showEvents: {
						showIROfficialEvents: true,
						showIRHistoricalEvents: true,
						showIRAncientEvents: true,
						showGlobalEvents: true,
						showShiaEvents: true,
						showSunniEvents: true,
					},
					hijriBase: options?.base ?? "iran",
				}),
		});
	}
}
