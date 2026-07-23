/**
 * Gregorian naming mapping for Month Note / Year Note.
 *
 * IMPORTANT: this is only a naming/label mapping used to pick a Gregorian-looking
 * file name for interoperability with other calendar plugins. It is NOT a real
 * calendar conversion and must never be used for Daily Note dates or for any
 * actual date arithmetic. Real conversion (jalaliToGregorian / gregorianToJalali)
 * must continue to be used for everything else, including resolving dynamic
 * folder path tokens.
 */

export function mapJalaliMonthToGregorianLabel(jalaliYear: number, jalaliMonth: number) {
	let year = jalaliYear + 621;
	let month = jalaliMonth + 2;

	if (month > 12) {
		month -= 12;
		year += 1;
	}

	return { year, month };
}

export function mapJalaliYearToGregorianLabel(jalaliYear: number) {
	return { year: jalaliYear + 621 };
}
