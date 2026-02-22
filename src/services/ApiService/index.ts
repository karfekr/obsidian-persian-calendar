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
	jalaliToDate,
	jalaliToGregorian,
	jalaliToHijri,
} from "src/utils/dateUtils";
import { hijriToDate } from "src/utils/dateUtils/hijriUtils";
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
			dateToHijri,
			hijriToDate,
			hijriToGregorian,
			hijriToJalali,
			jalaliMonthName,
			seasonName,
			checkHoliday,
			dateToEvents: (date: Date) =>
				dateToEvents(date, {
					showIRGovernmentEvents: true,
					showIRAncientEvents: true,
					showIRIslamEvents: true,
					showGlobalEvents: true,
				}),
		});
	}
}
