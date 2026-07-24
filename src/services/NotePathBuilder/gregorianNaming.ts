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
