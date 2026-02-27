import { describe, expect, it } from "vitest";
import {
	checkKabiseh,
	checkValidJalali,
	dateToJalali,
	dateToJWeekNumber,
	getDaysInJalaliYear,
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToDate,
	jalaliToGregorian,
	jalaliToJWeekNumber,
} from "src/utils/dateUtils/jalaliUtils";
import { gregorianToDate } from "src/utils/dateUtils/gregorianUtils";
import {
	gregorianValidDates,
	jalaliInvalidDates,
	jalaliLeapYearDates,
	jalaliTestDates,
	jalaliValidDates,
	leapYears,
	monthCases,
	months30,
	months31,
	nonLeapYears,
	weekStarts,
} from "./fixtures";

describe("Conversions", () => {
	describe("dateToJalali", () => {
		it.each(jalaliTestDates)(
			"should convert Gregorian %i/%i/%i to correct Jalali %i/%i/%i",
			({ gy, gm, gd, jy, jm, jd }) => {
				const date = gregorianToDate(gy, gm, gd);
				const result = dateToJalali(date);
				expect(result).toEqual({ jy, jm, jd });
				expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
			},
		);
	});

	describe("jalaliToDate", () => {
		it.each(jalaliValidDates)(
			"should convert Jalali %i/%i/%i to a valid Date",
			({ jy, jm, jd }) => {
				const result = jalaliToDate(jy, jm, jd);
				expect(result).toBeInstanceOf(Date);
				const back = dateToJalali(result);
				expect(back).toEqual({ jy, jm, jd });
			},
		);

		it.each(jalaliLeapYearDates)("should handle leap year Jalali %i/%i/%i", ({ jy, jm, jd }) => {
			const result = jalaliToDate(jy, jm, jd);
			expect(result).toBeInstanceOf(Date);
		});
	});

	describe("jalaliToGregorian", () => {
		it.each(jalaliTestDates)(
			"should convert Jalali %i/%i/%i to correct Gregorian %i/%i/%i",
			({ jy, jm, jd, gy, gm, gd }) => {
				const result = jalaliToGregorian(jy, jm, jd);
				expect(result).toEqual({ gy, gm, gd });
			},
		);

		it.each(jalaliValidDates)(
			"round-trip consistency: Jalali %i/%i/%i -> Gregorian -> Jalali",
			({ jy, jm, jd }) => {
				const gregorian = jalaliToGregorian(jy, jm, jd);
				const back = gregorianToJalali(gregorian.gy, gregorian.gm, gregorian.gd);
				expect(back).toEqual({ jy, jm, jd });
			},
		);
	});

	describe("gregorianToJalali", () => {
		it.each(jalaliTestDates)(
			"should convert Gregorian %i/%i/%i to correct Jalali %i/%i/%i",
			({ gy, gm, gd, jy, jm, jd }) => {
				const result = gregorianToJalali(gy, gm, gd);
				expect(result).toEqual({ jy, jm, jd });
				expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
			},
		);

		it.each(gregorianValidDates)(
			"round-trip consistency: Gregorian %i/%i/%i -> Jalali -> Gregorian",
			({ gy, gm, gd }) => {
				const jalali = gregorianToJalali(gy, gm, gd);
				const back = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd);
				expect(back).toEqual({ gy, gm, gd });
			},
		);
	});
});

describe("dateToJWeekNumber", () => {
	it.each(jalaliTestDates)(
		"should correctly convert Gregorian %i/%i/%i to Jalali week number",
		({ gy, gm, gd }) => {
			const date = gregorianToDate(gy, gm - 1, gd);
			const weekNum = dateToJWeekNumber(date);
			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThanOrEqual(53);
		},
	);

	it.each(jalaliTestDates)(
		"should be consistent with jalaliToJWeekNumber for %i/%i/%i",
		({ gy, gm, gd }) => {
			const date = gregorianToDate(gy, gm - 1, gd);
			const { jy, jm, jd } = dateToJalali(date);
			expect(dateToJWeekNumber(date)).toBe(jalaliToJWeekNumber(jy, jm, jd));
		},
	);

	it.each(weekStarts)("should return valid week number with weekStart '%s'", (weekStart) => {
		jalaliTestDates.forEach(({ gy, gm, gd }) => {
			const date = gregorianToDate(gy, gm - 1, gd);
			const weekNum = dateToJWeekNumber(date, weekStart);
			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThanOrEqual(53);
		});
	});
});

describe("jalaliToJWeekNumber", () => {
	it.each(jalaliTestDates)(
		"should return valid week number for Jalali date %i/%i/%i",
		({ jy, jm, jd }) => {
			const weekNum = jalaliToJWeekNumber(jy, jm, jd);
			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThanOrEqual(53);
		},
	);

	it.each(weekStarts)("should return valid week number with weekStart '%s'", (weekStart) => {
		jalaliTestDates.forEach(({ jy, jm, jd }) => {
			const weekNum = jalaliToJWeekNumber(jy, jm, jd, weekStart);
			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThanOrEqual(53);
		});
	});

	it("should return increasing week numbers throughout the year", () => {
		const testYears = [...leapYears, ...nonLeapYears];
		testYears.forEach((year) => {
			let prevWeek = 0;
			for (let month = 1; month <= 12; month++) {
				const day = Math.min(15, jalaliMonthLength(year, month));
				const weekNum = jalaliToJWeekNumber(year, month, day);
				expect(weekNum).toBeGreaterThanOrEqual(prevWeek);
				prevWeek = weekNum;
			}
		});
	});

	it("should handle last day of year correctly", () => {
		const year = 1403;
		const lastMonth = 12;
		const lastDay = 30;
		const weekNum = jalaliToJWeekNumber(year, lastMonth, lastDay);
		expect(weekNum).toBeGreaterThan(50);
		expect(weekNum).toBeLessThanOrEqual(53);
	});
});

describe("checkKabiseh", () => {
	it.each(leapYears)("should detect leap year %i", (year) => {
		expect(checkKabiseh(year)).toBe(true);
	});

	it.each(nonLeapYears)("should detect non-leap year %i", (year) => {
		expect(checkKabiseh(year)).toBe(false);
	});
});

describe("jalaliMonthLength", () => {
	it.each(monthCases)(
		"should return correct length for year %i, month %i",
		(year, month, expectedLength) => {
			expect(jalaliMonthLength(year, month)).toBe(expectedLength);
		},
	);
});

describe("getDaysInJalaliYear", () => {
	it.each(nonLeapYears)("should return 365 days for non-leap year %i", (year) => {
		expect(getDaysInJalaliYear(year)).toBe(365);
	});

	it.each(leapYears)("should return 366 days for leap year %i", (year) => {
		expect(getDaysInJalaliYear(year)).toBe(366);
	});

	it.each([...leapYears, ...nonLeapYears])("should sum months correctly for year %i", (year) => {
		const expectedTotal = Array.from({ length: 12 }, (_, i) =>
			jalaliMonthLength(year, i + 1),
		).reduce((a, b) => a + b, 0);
		expect(getDaysInJalaliYear(year)).toBe(expectedTotal);
	});
});

describe("checkValidJalali", () => {
	it.each(jalaliValidDates)(
		"should return true for valid date %i/%i/%i",
		({ jy, jm, jd, expected }) => {
			expect(checkValidJalali(jy, jm, jd)).toBe(expected);
		},
	);

	it.each(jalaliInvalidDates)(
		"should return false for invalid date %i/%i/%i",
		({ jy, jm, jd, expected }) => {
			expect(checkValidJalali(jy, jm, jd)).toBe(expected);
		},
	);

	it.each(months31)("should allow 31 days for month %i and reject 32", (month) => {
		expect(checkValidJalali(1403, month, 31)).toBe(true);
		expect(checkValidJalali(1403, month, 32)).toBe(false);
	});

	it.each(months30)("should allow 30 days for month %i and reject 31", (month) => {
		expect(checkValidJalali(1403, month, 30)).toBe(true);
		expect(checkValidJalali(1403, month, 31)).toBe(false);
	});
});
