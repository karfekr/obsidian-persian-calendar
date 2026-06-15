import type { THijriBase } from "src/types";
import {
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianToDate,
	gregorianToHijri,
	gregorianToJalali,
	hijriMonthLength,
	hijriToDate,
	hijriToGregorian,
	hijriToJalali,
	jalaliMonthLength,
	jalaliMonthName,
	jalaliToDate,
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
			dateToEvents: (date: Date, options?: { base?: THijriBase }) =>
				dateToEvents(date, {
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
