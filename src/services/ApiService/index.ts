import type { THijriBase } from "src/types";
import {
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	jalaliMonthName,
	seasonName,
	gregorianToDate,
	gregorianToHijri,
	gregorianToJalali,
	hijriToGregorian,
	hijriToJalali,
	hijriToDate,
	jalaliToDate,
	jalaliToGregorian,
	jalaliToHijri,
	jalaliMonthLength,
	hijriMonthLength,
} from "src/utils/dateUtils";
import { checkHoliday, dateToEvents } from "src/utils/eventUtils";
import { toEnNumber, toFaNumber } from "src/utils/formatters";

export default class ApiService {
	build() {
		return Object.freeze({
			toEnNumber,
			toFaNumber,
			dateToGregorian,
			gregorianToDate,
			gregorianToJalali,
			gregorianToHijri,
			dateToJalali,
			jalaliToDate,
			jalaliToGregorian,
			jalaliToHijri,
			jalaliMonthLength,
			dateToHijri,
			hijriToDate,
			hijriToGregorian,
			hijriToJalali,
			hijriMonthLength,
			jalaliMonthName,
			seasonName,
			checkHoliday,
			dateToEvents: (date: Date, hijriBase: THijriBase) =>
				dateToEvents(date, {
					showEvents: {
						showIROfficialEvents: true,
						showIRHistoricalEvents: true,
						showIRAncientEvents: true,
						showGlobalEvents: true,
						showShiaEvents: true,
						showSunniEvents: true,
					},
					hijriBase,
				}),
		});
	}
}
