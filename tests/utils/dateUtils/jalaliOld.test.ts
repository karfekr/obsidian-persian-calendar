import { describe, it, expect } from "vitest";
import {
	dateToJalali,
	checkValidJalali,
	dateToDayOfMonth,
	dateToDaysPassedJMonth,
	dateToDaysPassedJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingJMonth,
	dateToDaysRemainingJYear,
	dateToDaysRemainingSeason,
	dateToEndDayOfJMonthDate,
	dateToEndDayOfSeasonDate,
	dateToJWeekNumber,
	dateToStartDayOfJMonthDate,
	dateToStartDayOfSeasonDate,
	getDaysInJalaliYear,
	getFirstWeekStartOfJYear,
	jalaliMonthLength,
	jalaliMonthToGregorianRange,
	jalaliMonthToHijriRange,
	jalaliToDate,
	jalaliToEndDayOfWeek,
	jalaliToGregorian,
	jalaliToJWeekNumber,
	jalaliToStartDayOfWeek,
} from "src/utils/dateUtils/jalaliUtils";
import { jalaliToSeason } from "src/utils/dateUtils/gregorianUtils";
import { jalaliToHijri } from "src/utils/dateUtils/hijriUtils";

describe("getFirstWeekStartOfJYear", () => {
	it("should return first week start with default weekStart (Saturday)", () => {
		const result = getFirstWeekStartOfJYear(1403);

		expect(result).toHaveProperty("jy");
		expect(result).toHaveProperty("jm");
		expect(result).toHaveProperty("jd");
		expect(result.jy).toBe(1403);
	});

	it("should return dates in first month or last month of previous year", () => {
		const result = getFirstWeekStartOfJYear(1403);

		if (result.jy === 1403) {
			expect(result.jm).toBe(1);
		} else {
			expect(result.jy).toBe(1402);
			expect(result.jm).toBe(12);
		}
	});

	it("should handle different weekStart options", () => {
		const resultSat = getFirstWeekStartOfJYear(1403, "sat");
		const resultSun = getFirstWeekStartOfJYear(1403, "sun");
		const resultMon = getFirstWeekStartOfJYear(1403, "mon");

		expect(checkValidJalali(resultSat.jy, resultSat.jm, resultSat.jd)).toBe(true);
		expect(checkValidJalali(resultSun.jy, resultSun.jm, resultSun.jd)).toBe(true);
		expect(checkValidJalali(resultMon.jy, resultMon.jm, resultMon.jd)).toBe(true);
	});

	it("should return a date within 7 days of year start", () => {
		const result = getFirstWeekStartOfJYear(1403);
		const yearStart = jalaliToDate(1403, 1, 1);
		const firstWeekStart = jalaliToDate(result.jy, result.jm, result.jd);

		const diffDays = Math.abs(
			(firstWeekStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
		);

		expect(diffDays).toBeLessThanOrEqual(7);
	});
});

describe("jalaliToStartDayOfWeek", () => {
	it("should return start day of first week", () => {
		const result = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 1 });

		expect(result).toHaveProperty("jy");
		expect(result).toHaveProperty("jm");
		expect(result).toHaveProperty("jd");
		expect(result).toHaveProperty("gy");
		expect(result).toHaveProperty("gm");
		expect(result).toHaveProperty("gd");
	});

	it("should return valid Jalali date", () => {
		const result = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 10 });
		expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
	});

	it("should handle different week numbers", () => {
		const weeks = [1, 10, 20, 30, 40, 50];

		weeks.forEach((weekNum) => {
			const result = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: weekNum });
			expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
		});
	});

	it("should handle different weekStart options", () => {
		const resultSat = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "sat");
		const resultSun = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "sun");
		const resultMon = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "mon");

		expect(checkValidJalali(resultSat.jy, resultSat.jm, resultSat.jd)).toBe(true);
		expect(checkValidJalali(resultSun.jy, resultSun.jm, resultSun.jd)).toBe(true);
		expect(checkValidJalali(resultMon.jy, resultMon.jm, resultMon.jd)).toBe(true);
	});

	it("should return correct Gregorian date", () => {
		const result = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 1 });
		const jalaliToGreg = jalaliToGregorian(result.jy, result.jm, result.jd);

		expect(result.gy).toBe(jalaliToGreg.gy);
		expect(result.gm).toBe(jalaliToGreg.gm);
		expect(result.gd).toBe(jalaliToGreg.gd);
	});
});

describe("jalaliToEndDayOfWeek", () => {
	it("should return end day of first week", () => {
		const result = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 1 });

		expect(result).toHaveProperty("jy");
		expect(result).toHaveProperty("jm");
		expect(result).toHaveProperty("jd");
		expect(result).toHaveProperty("gy");
		expect(result).toHaveProperty("gm");
		expect(result).toHaveProperty("gd");
	});

	it("should return valid Jalali date", () => {
		const result = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 10 });
		expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
	});

	it("should be 6 days after start day", () => {
		const start = jalaliToStartDayOfWeek({ jYear: 1403, jWeekNumber: 10 });
		const end = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 10 });

		const startDate = jalaliToDate(start.jy, start.jm, start.jd);
		const endDate = jalaliToDate(end.jy, end.jm, end.jd);

		const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		expect(diffDays).toBe(6);
	});

	it("should handle different week numbers", () => {
		const weeks = [1, 10, 20, 30, 40, 50];

		weeks.forEach((weekNum) => {
			const result = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: weekNum });
			expect(checkValidJalali(result.jy, result.jm, result.jd)).toBe(true);
		});
	});

	it("should handle different weekStart options", () => {
		const resultSat = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "sat");
		const resultSun = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "sun");
		const resultMon = jalaliToEndDayOfWeek({ jYear: 1403, jWeekNumber: 5 }, "mon");

		expect(checkValidJalali(resultSat.jy, resultSat.jm, resultSat.jd)).toBe(true);
		expect(checkValidJalali(resultSun.jy, resultSun.jm, resultSun.jd)).toBe(true);
		expect(checkValidJalali(resultMon.jy, resultMon.jm, resultMon.jd)).toBe(true);
	});
});

describe("dateToStartDayOfJMonthDate", () => {
	it("should return first day of month", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const result = dateToStartDayOfJMonthDate(date);
		const jalali = dateToJalali(result);

		expect(jalali.jd).toBe(1);
	});

	it("should be in same month and year", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy, jm } = dateToJalali(date);

		const result = dateToStartDayOfJMonthDate(date);
		const resultJalali = dateToJalali(result);

		expect(resultJalali.jy).toBe(jy);
		expect(resultJalali.jm).toBe(jm);
	});

	it("should handle dates throughout the year", () => {
		for (let month = 0; month < 12; month++) {
			const date = new Date(Date.UTC(2024, month, 15, 12, 0, 0));
			const result = dateToStartDayOfJMonthDate(date);
			const jalali = dateToJalali(result);

			expect(jalali.jd).toBe(1);
		}
	});
});

describe("dateToEndDayOfJMonthDate", () => {
	it("should return last day of month", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy, jm } = dateToJalali(date);
		const expectedLastDay = jalaliMonthLength(jy, jm);

		const result = dateToEndDayOfJMonthDate(date);
		const jalali = dateToJalali(result);

		expect(jalali.jd).toBe(expectedLastDay);
	});

	it("should be in same month and year", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy, jm } = dateToJalali(date);

		const result = dateToEndDayOfJMonthDate(date);
		const resultJalali = dateToJalali(result);

		expect(resultJalali.jy).toBe(jy);
		expect(resultJalali.jm).toBe(jm);
	});

	it("should handle first 6 months (31 days)", () => {
		for (let month = 1; month <= 6; month++) {
			const date = jalaliToDate(1403, month, 15);
			const result = dateToEndDayOfJMonthDate(date);
			const jalali = dateToJalali(result);

			expect(jalali.jd).toBe(31);
		}
	});

	it("should handle months 7-11 (30 days)", () => {
		for (let month = 7; month <= 11; month++) {
			const date = jalaliToDate(1403, month, 15);
			const result = dateToEndDayOfJMonthDate(date);
			const jalali = dateToJalali(result);

			expect(jalali.jd).toBe(30);
		}
	});
});

describe("dateToStartDayOfSeasonDate", () => {
	it("should return first day of season", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const result = dateToStartDayOfSeasonDate(date);
		const jalali = dateToJalali(result);

		expect(jalali.jd).toBe(1);
		expect([1, 4, 7, 10]).toContain(jalali.jm);
	});

	it("should be in same year", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy } = dateToJalali(date);

		const result = dateToStartDayOfSeasonDate(date);
		const resultJalali = dateToJalali(result);

		expect(resultJalali.jy).toBe(jy);
	});

	it("should handle all seasons", () => {
		const months = [2, 5, 8, 11];

		months.forEach((month) => {
			const date = new Date(Date.UTC(2024, month, 15, 12, 0, 0));
			const result = dateToStartDayOfSeasonDate(date);
			const jalali = dateToJalali(result);

			expect(jalali.jd).toBe(1);
			expect([1, 4, 7, 10]).toContain(jalali.jm);
		});
	});
});

describe("dateToEndDayOfSeasonDate", () => {
	it("should return last day of season", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const result = dateToEndDayOfSeasonDate(date);
		const jalali = dateToJalali(result);

		expect([3, 6, 9, 12]).toContain(jalali.jm);
	});

	it("should be in same year", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy } = dateToJalali(date);

		const result = dateToEndDayOfSeasonDate(date);
		const resultJalali = dateToJalali(result);

		expect(resultJalali.jy).toBe(jy);
	});

	it("should be last day of last month of season", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy, jm } = dateToJalali(date);
		const season = jalaliToSeason(jm);
		const lastMonthOfSeason = 3 * season;
		const expectedLastDay = jalaliMonthLength(jy, lastMonthOfSeason);

		const result = dateToEndDayOfSeasonDate(date);
		const jalali = dateToJalali(result);

		expect(jalali.jd).toBe(expectedLastDay);
		expect(jalali.jm).toBe(lastMonthOfSeason);
	});
});

describe("dateToDayOfMonth", () => {
	it("should return day of month", () => {
		const date = jalaliToDate(1403, 6, 15);
		const result = dateToDayOfMonth(date);

		expect(result).toBe(15);
	});

	it("should return 1 for first day of month", () => {
		const date = jalaliToDate(1403, 3, 1);
		const result = dateToDayOfMonth(date);

		expect(result).toBe(1);
	});

	it("should return correct day for last day of month", () => {
		const monthLength = jalaliMonthLength(1403, 6);
		const date = jalaliToDate(1403, 6, monthLength);
		const result = dateToDayOfMonth(date);

		expect(result).toBe(monthLength);
	});

	it("should handle different dates", () => {
		for (let day = 1; day <= 31; day++) {
			const date = jalaliToDate(1403, 1, day);
			const result = dateToDayOfMonth(date);
			expect(result).toBe(day);
		}
	});
});

describe("dateToDaysPassedJYear", () => {
	it("should return 1 for first day of year", () => {
		const date = jalaliToDate(1403, 1, 1);
		const result = dateToDaysPassedJYear(date);

		expect(result).toBe(1);
	});

	it("should return 32 for second month first day", () => {
		const date = jalaliToDate(1403, 2, 1);
		const result = dateToDaysPassedJYear(date);

		expect(result).toBe(32);
	});

	it("should return total days for last day of year", () => {
		const monthLength = jalaliMonthLength(1403, 12);
		const date = jalaliToDate(1403, 12, monthLength);
		const result = dateToDaysPassedJYear(date);
		const totalDays = getDaysInJalaliYear(1403);

		expect(result).toBe(totalDays);
	});

	it("should increase monotonically throughout the year", () => {
		let prevDays = 0;

		for (let month = 1; month <= 12; month++) {
			const date = jalaliToDate(1403, month, 15);
			const days = dateToDaysPassedJYear(date);

			expect(days).toBeGreaterThan(prevDays);
			prevDays = days;
		}
	});
});

describe("dateToDaysRemainingJYear", () => {
	it("should return total days - 1 for first day of year", () => {
		const date = jalaliToDate(1403, 1, 1);
		const result = dateToDaysRemainingJYear(date);
		const totalDays = getDaysInJalaliYear(1403);

		expect(result).toBe(totalDays - 1);
	});

	it("should return 0 for last day of year", () => {
		const monthLength = jalaliMonthLength(1403, 12);
		const date = jalaliToDate(1403, 12, monthLength);
		const result = dateToDaysRemainingJYear(date);

		expect(result).toBe(0);
	});

	it("should sum with passed days to equal total days - 1", () => {
		const date = jalaliToDate(1403, 6, 15);
		const passed = dateToDaysPassedJYear(date);
		const remaining = dateToDaysRemainingJYear(date);
		const totalDays = getDaysInJalaliYear(1403);

		expect(passed + remaining).toBe(totalDays);
	});

	it("should decrease monotonically throughout the year", () => {
		let prevRemaining = getDaysInJalaliYear(1403);

		for (let month = 1; month <= 12; month++) {
			const date = jalaliToDate(1403, month, 15);
			const remaining = dateToDaysRemainingJYear(date);

			expect(remaining).toBeLessThan(prevRemaining);
			prevRemaining = remaining;
		}
	});
});

describe("dateToDaysPassedSeason", () => {
	it("should return 1 for first day of season", () => {
		const date = jalaliToDate(1403, 1, 1);
		const result = dateToDaysPassedSeason(date);

		expect(result).toBe(1);
	});

	it("should return correct value for mid-season", () => {
		const date = jalaliToDate(1403, 2, 1);
		const result = dateToDaysPassedSeason(date);

		expect(result).toBe(32);
	});

	it("should reset at start of new season", () => {
		const endOfSpring = jalaliToDate(1403, 3, 31);
		const startOfSummer = jalaliToDate(1403, 4, 1);

		const passedSpring = dateToDaysPassedSeason(endOfSpring);
		const passedSummer = dateToDaysPassedSeason(startOfSummer);

		expect(passedSpring).toBeGreaterThan(passedSummer);
		expect(passedSummer).toBe(1);
	});

	it("should be less than or equal to season length", () => {
		for (let month = 1; month <= 12; month++) {
			const date = jalaliToDate(1403, month, 15);
			const passed = dateToDaysPassedSeason(date);

			expect(passed).toBeGreaterThan(0);
			expect(passed).toBeLessThanOrEqual(93);
		}
	});
});

describe("dateToDaysRemainingSeason", () => {
	it("should return season length - 1 for first day of season", () => {
		const date = jalaliToDate(1403, 1, 1);
		const result = dateToDaysRemainingSeason(date);

		expect(result).toBe(92);
	});

	it("should return 0 for last day of season", () => {
		const date = jalaliToDate(1403, 3, 31);
		const result = dateToDaysRemainingSeason(date);

		expect(result).toBe(0);
	});

	it("should sum with passed days to equal season total", () => {
		const date = jalaliToDate(1403, 2, 15);
		const passed = dateToDaysPassedSeason(date);
		const remaining = dateToDaysRemainingSeason(date);

		const { jy, jm } = dateToJalali(date);
		const season = jalaliToSeason(jm);
		const startMonth = (season - 1) * 3 + 1;
		const endMonth = startMonth + 2;

		let seasonLength = 0;
		for (let m = startMonth; m <= endMonth; m++) {
			seasonLength += jalaliMonthLength(jy, m);
		}

		expect(passed + remaining).toBe(seasonLength);
	});
});

describe("dateToDaysPassedJMonth", () => {
	it("should return day of month", () => {
		const date = jalaliToDate(1403, 6, 15);
		const result = dateToDaysPassedJMonth(date);

		expect(result).toBe(15);
	});

	it("should return 1 for first day", () => {
		const date = jalaliToDate(1403, 3, 1);
		const result = dateToDaysPassedJMonth(date);

		expect(result).toBe(1);
	});

	it("should be same as dateToDayOfMonth", () => {
		const date = jalaliToDate(1403, 5, 20);
		const passed = dateToDaysPassedJMonth(date);
		const dayOfMonth = dateToDayOfMonth(date);

		expect(passed).toBe(dayOfMonth);
	});
});

describe("dateToDaysRemainingJMonth", () => {
	it("should return month length - 1 for first day", () => {
		const date = jalaliToDate(1403, 6, 1);
		const result = dateToDaysRemainingJMonth(date);

		expect(result).toBe(30);
	});

	it("should return 0 for last day of month", () => {
		const monthLength = jalaliMonthLength(1403, 6);
		const date = jalaliToDate(1403, 6, monthLength);
		const result = dateToDaysRemainingJMonth(date);

		expect(result).toBe(0);
	});

	it("should sum with passed days to equal month length", () => {
		const date = jalaliToDate(1403, 6, 15);
		const { jy, jm } = dateToJalali(date);

		const passed = dateToDaysPassedJMonth(date);
		const remaining = dateToDaysRemainingJMonth(date);
		const monthLength = jalaliMonthLength(jy, jm);

		expect(passed + remaining).toBe(monthLength);
	});
});

describe("jalaliMonthToGregorianRange", () => {
	it("should return gregorian range for Jalali month", () => {
		const result = jalaliMonthToGregorianRange(1403, 1);

		expect(result).toHaveProperty("firstDay");
		expect(result).toHaveProperty("lastDay");
		expect(result.firstDay).toHaveProperty("gy");
		expect(result.firstDay).toHaveProperty("gm");
		expect(result.firstDay).toHaveProperty("gd");
		expect(result.lastDay).toHaveProperty("gy");
		expect(result.lastDay).toHaveProperty("gm");
		expect(result.lastDay).toHaveProperty("gd");
	});

	it("should have first day before or equal to last day", () => {
		const result = jalaliMonthToGregorianRange(1403, 6);

		const firstDate = new Date(result.firstDay.gy, result.firstDay.gm - 1, result.firstDay.gd);
		const lastDate = new Date(result.lastDay.gy, result.lastDay.gm - 1, result.lastDay.gd);

		expect(firstDate.getTime()).toBeLessThanOrEqual(lastDate.getTime());
	});

	it("should match jalaliToGregorian for first and last days", () => {
		const monthLength = jalaliMonthLength(1403, 6);
		const result = jalaliMonthToGregorianRange(1403, 6);

		const expectedFirst = jalaliToGregorian(1403, 6, 1);
		const expectedLast = jalaliToGregorian(1403, 6, monthLength);

		expect(result.firstDay).toEqual(expectedFirst);
		expect(result.lastDay).toEqual(expectedLast);
	});

	it("should handle all months", () => {
		for (let month = 1; month <= 12; month++) {
			const result = jalaliMonthToGregorianRange(1403, month);

			expect(result.firstDay.gm).toBeGreaterThanOrEqual(1);
			expect(result.firstDay.gm).toBeLessThanOrEqual(12);
			expect(result.lastDay.gm).toBeGreaterThanOrEqual(1);
			expect(result.lastDay.gm).toBeLessThanOrEqual(12);
		}
	});

	it("should handle Nowruz month (Farvardin)", () => {
		const result = jalaliMonthToGregorianRange(1403, 1);

		expect(result.firstDay.gm).toBe(3);
		expect([19, 20, 21]).toContain(result.firstDay.gd);
	});
});

describe("jalaliMonthToHijriRange", () => {
	it("should return Hijri range for Jalali month with Iran base (default)", () => {
		const result = jalaliMonthToHijriRange(1403, 1);

		expect(result).toHaveProperty("firstDay");
		expect(result).toHaveProperty("lastDay");
		expect(result.firstDay).toHaveProperty("hy");
		expect(result.firstDay).toHaveProperty("hm");
		expect(result.firstDay).toHaveProperty("hd");
		expect(result.lastDay).toHaveProperty("hy");
		expect(result.lastDay).toHaveProperty("hm");
		expect(result.lastDay).toHaveProperty("hd");
	});

	it("should return Hijri range with Umalqura base", () => {
		const result = jalaliMonthToHijriRange(1403, 1, { base: "umalqura" });

		expect(result.firstDay.hy).toBeGreaterThan(1400);
		expect(result.lastDay.hy).toBeGreaterThan(1400);
	});

	it("should match jalaliToHijri for first and last days", () => {
		const monthLength = jalaliMonthLength(1403, 6);
		const result = jalaliMonthToHijriRange(1403, 6, { base: "iran" });

		const expectedFirst = jalaliToHijri(1403, 6, 1, { base: "iran" });
		const expectedLast = jalaliToHijri(1403, 6, monthLength, { base: "iran" });

		expect(result.firstDay).toEqual(expectedFirst);
		expect(result.lastDay).toEqual(expectedLast);
	});

	it("should handle all months", () => {
		for (let month = 1; month <= 12; month++) {
			const result = jalaliMonthToHijriRange(1403, month);

			expect(result.firstDay.hm).toBeGreaterThanOrEqual(1);
			expect(result.firstDay.hm).toBeLessThanOrEqual(12);
			expect(result.lastDay.hm).toBeGreaterThanOrEqual(1);
			expect(result.lastDay.hm).toBeLessThanOrEqual(12);
		}
	});

	it("should produce different results for Iran and Umalqura bases", () => {
		const iranResult = jalaliMonthToHijriRange(1403, 6, { base: "iran" });
		const umalquraResult = jalaliMonthToHijriRange(1403, 6, { base: "umalqura" });

		expect(iranResult.firstDay.hy).toBeGreaterThan(0);
		expect(umalquraResult.firstDay.hy).toBeGreaterThan(0);
	});
});

describe("Integration and consistency tests", () => {
	it("should maintain consistency across date conversions", () => {
		const originalDate = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));

		const jalali = dateToJalali(originalDate);
		const backToDate = jalaliToDate(jalali.jy, jalali.jm, jalali.jd);

		expect(backToDate.getTime()).toBe(originalDate.getTime());
	});

	it("should maintain consistency in month boundaries", () => {
		const startDate = dateToStartDayOfJMonthDate(new Date(Date.UTC(2024, 5, 15, 12, 0, 0)));
		const endDate = dateToEndDayOfJMonthDate(new Date(Date.UTC(2024, 5, 15, 12, 0, 0)));

		const startJalali = dateToJalali(startDate);
		const endJalali = dateToJalali(endDate);

		expect(startJalali.jy).toBe(endJalali.jy);
		expect(startJalali.jm).toBe(endJalali.jm);
		expect(startJalali.jd).toBe(1);
	});

	it("should maintain consistency in season boundaries", () => {
		const startDate = dateToStartDayOfSeasonDate(new Date(Date.UTC(2024, 5, 15, 12, 0, 0)));
		const endDate = dateToEndDayOfSeasonDate(new Date(Date.UTC(2024, 5, 15, 12, 0, 0)));

		const startJalali = dateToJalali(startDate);
		const endJalali = dateToJalali(endDate);

		expect(startJalali.jy).toBe(endJalali.jy);
		expect([1, 4, 7, 10]).toContain(startJalali.jm);
		expect([3, 6, 9, 12]).toContain(endJalali.jm);
	});

	it("should maintain consistency in day counting", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy } = dateToJalali(date);

		const passed = dateToDaysPassedJYear(date);
		const remaining = dateToDaysRemainingJYear(date);
		const total = getDaysInJalaliYear(jy);

		expect(passed + remaining).toBe(total);
	});

	it("should maintain consistency across week calculations", () => {
		const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
		const { jy, jm, jd } = dateToJalali(date);

		const weekNumFromDate = dateToJWeekNumber(date);
		const weekNumFromJalali = jalaliToJWeekNumber(jy, jm, jd);

		expect(weekNumFromDate).toBe(weekNumFromJalali);
	});
});
