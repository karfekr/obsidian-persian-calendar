import {
	checkValidJalali,
	checkKabiseh,
	dateToJalali,
	jalaliToDate,
	jalaliToGregorian,
	gregorianToJalali,
	jalaliMonthLength,
	getDaysInJalaliYear,
	dateToJWeekNumber,
	jalaliToJWeekNumber,
	getFirstWeekStartOfJYear,
	jalaliToStartDayOfWeek,
	jalaliToEndDayOfWeek,
	dateToMonthName,
	dateToSeasonName,
	dateToDayOfMonth,
	dateToDaysPassedJYear,
	dateToDaysRemainingJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingSeason,
	dateToDaysPassedJMonth,
	dateToDaysRemainingJMonth,
	dateToStartDayOfJMonthDate,
	dateToEndDayOfJMonthDate,
	dateToStartDayOfSeasonDate,
	dateToEndDayOfSeasonDate,
	jalaliMonthToGregorianRange,
	jalaliMonthToHijriRange,
} from "src/utils/dateUtils/jalaliUtils";
import { hijriToDate } from "src/utils/dateUtils";

describe("checkValidJalali", () => {
	it("should return true for a valid date", () => {
		expect(checkValidJalali(1404, 1, 1)).toBe(true);
	});

	it("should return true for the last day of a non-leap year (Esfand 29)", () => {
		expect(checkValidJalali(1404, 12, 29)).toBe(true);
	});

	it("should return false for Esfand 30 in a non-leap year", () => {
		expect(checkValidJalali(1404, 12, 30)).toBe(false);
	});

	it("should return true for Esfand 30 in a leap year", () => {
		// 1399 is a leap year
		expect(checkValidJalali(1399, 12, 30)).toBe(true);
	});

	it("should return false for month 0", () => {
		expect(checkValidJalali(1404, 0, 1)).toBe(false);
	});

	it("should return false for month 13", () => {
		expect(checkValidJalali(1404, 13, 1)).toBe(false);
	});

	it("should return false for day 0", () => {
		expect(checkValidJalali(1404, 1, 0)).toBe(false);
	});

	it("should return false for day 32 in first 6 months", () => {
		expect(checkValidJalali(1404, 1, 32)).toBe(false);
	});

	it("should return false for day 31 in months 7–11", () => {
		expect(checkValidJalali(1404, 7, 31)).toBe(false);
	});

	it("should return true for day 30 in months 7–11", () => {
		expect(checkValidJalali(1404, 7, 30)).toBe(true);
	});
});

describe("checkKabiseh", () => {
	it("should return true for known leap year 1399", () => {
		expect(checkKabiseh(1399)).toBe(true);
	});

	it("should return true for known leap year 1403", () => {
		expect(checkKabiseh(1403)).toBe(true);
	});

	it("should return false for non-leap year 1404", () => {
		expect(checkKabiseh(1404)).toBe(false);
	});

	it("should return false for non-leap year 1400", () => {
		expect(checkKabiseh(1400)).toBe(false);
	});
});

describe("dateToJalali", () => {
	it("should convert Gregorian date to Jalali correctly", () => {
		// 2024-03-20 = 1403/01/01
		const result = dateToJalali(new Date("2024-03-20"));
		expect(result.jy).toBe(1403);
		expect(result.jm).toBe(1);
		expect(result.jd).toBe(1);
	});

	it("should handle end of year correctly", () => {
		// 2025-03-19 = 1403/12/29
		const result = dateToJalali(new Date("2025-03-19"));
		expect(result.jy).toBe(1403);
		expect(result.jm).toBe(12);
		expect(result.jd).toBe(29);
	});
});

describe("jalaliToDate", () => {
	it("should convert 1403/01/01 to 2024-03-20", () => {
		const date = jalaliToDate(1403, 1, 1);
		expect(date.getUTCFullYear()).toBe(2024);
		expect(date.getUTCMonth() + 1).toBe(3);
		expect(date.getUTCDate()).toBe(20);
	});
});

describe("jalaliToGregorian", () => {
	it("should convert 1403/01/01 → 2024/03/20", () => {
		const { gy, gm, gd } = jalaliToGregorian(1403, 1, 1);
		expect(gy).toBe(2024);
		expect(gm).toBe(3);
		expect(gd).toBe(20);
	});

	it("should convert 1399/12/30 (leap) → 2021/03/20", () => {
		const { gy, gm, gd } = jalaliToGregorian(1399, 12, 30);
		expect(gy).toBe(2021);
		expect(gm).toBe(3);
		expect(gd).toBe(20);
	});
});

describe("gregorianToJalali", () => {
	it("should convert 2024/03/20 → 1403/01/01", () => {
		const { jy, jm, jd } = gregorianToJalali(2024, 3, 20);
		expect(jy).toBe(1403);
		expect(jm).toBe(1);
		expect(jd).toBe(1);
	});

	it("should convert 2000/01/01 → 1378/10/11", () => {
		const { jy, jm, jd } = gregorianToJalali(2000, 1, 1);
		expect(jy).toBe(1378);
		expect(jm).toBe(10);
		expect(jd).toBe(11);
	});
});

describe("jalaliMonthLength", () => {
	it("should return 31 for months 1–6", () => {
		for (let m = 1; m <= 6; m++) {
			expect(jalaliMonthLength(1404, m)).toBe(31);
		}
	});

	it("should return 30 for months 7–11", () => {
		for (let m = 7; m <= 11; m++) {
			expect(jalaliMonthLength(1404, m)).toBe(30);
		}
	});

	it("should return 29 for Esfand in a non-leap year", () => {
		expect(jalaliMonthLength(1404, 12)).toBe(29);
	});

	it("should return 30 for Esfand in a leap year", () => {
		expect(jalaliMonthLength(1399, 12)).toBe(30);
	});
});

describe("getDaysInJalaliYear", () => {
	it("should return 365 for a non-leap year", () => {
		expect(getDaysInJalaliYear(1404)).toBe(365);
	});

	it("should return 366 for a leap year", () => {
		expect(getDaysInJalaliYear(1399)).toBe(366);
	});
});

describe("dateToJWeekNumber", () => {
	it("should return a number between 1 and 53", () => {
		const weekNum = dateToJWeekNumber(new Date("2024-06-01"));
		expect(weekNum).toBeGreaterThanOrEqual(1);
		expect(weekNum).toBeLessThanOrEqual(53);
	});
});

describe("jalaliToJWeekNumber", () => {
	it("should match dateToJWeekNumber for the same date", () => {
		// 2024-06-01 = 1403/03/12
		const fromDate = dateToJWeekNumber(new Date("2024-06-01"));
		const fromJalali = jalaliToJWeekNumber(1403, 3, 12);
		expect(fromJalali).toBe(fromDate);
	});

	it("should return 1 for the first week of the year", () => {
		// 1403/01/01 should be week 1
		expect(jalaliToJWeekNumber(1403, 1, 1)).toBe(1);
	});
});

describe("getFirstWeekStartOfJYear", () => {
	it("should return a valid Jalali date", () => {
		const result = getFirstWeekStartOfJYear(1404);
		expect(result.jy).toBe(1404);
		expect(result.jm).toBeGreaterThanOrEqual(1);
		expect(result.jd).toBeGreaterThanOrEqual(1);
	});

	it("should return a Saturday (first day of Iranian week)", () => {
		const result = getFirstWeekStartOfJYear(1404);
		const date = jalaliToDate(result.jy, result.jm, result.jd);
		// Saturday = 6 in JS
		expect(date.getUTCDay()).toBe(6);
	});
});

describe("jalaliToStartDayOfWeek", () => {
	it("should return the Saturday of the given week", () => {
		const result = jalaliToStartDayOfWeek({ jYear: 1404, jWeekNumber: 1 });
		const date = jalaliToDate(result.jy, result.jm, result.jd);
		expect(date.getUTCDay()).toBe(6); // Saturday
	});

	it("should contain both Jalali and Gregorian fields", () => {
		const result = jalaliToStartDayOfWeek({ jYear: 1404, jWeekNumber: 5 });
		expect(result).toHaveProperty("jy");
		expect(result).toHaveProperty("jm");
		expect(result).toHaveProperty("jd");
		expect(result).toHaveProperty("gy");
		expect(result).toHaveProperty("gm");
		expect(result).toHaveProperty("gd");
	});
});

describe("jalaliToEndDayOfWeek", () => {
	it("should return the Friday of the given week", () => {
		const result = jalaliToEndDayOfWeek({ jYear: 1404, jWeekNumber: 1 });
		const date = jalaliToDate(result.jy, result.jm, result.jd);
		expect(date.getUTCDay()).toBe(5); // Friday
	});

	it("end day should be 6 days after start day", () => {
		const start = jalaliToStartDayOfWeek({ jYear: 1404, jWeekNumber: 3 });
		const end = jalaliToEndDayOfWeek({ jYear: 1404, jWeekNumber: 3 });
		const startDate = jalaliToDate(start.jy, start.jm, start.jd);
		const endDate = jalaliToDate(end.jy, end.jm, end.jd);
		const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		expect(diffDays).toBe(6);
	});
});

describe("dateToMonthName", () => {
	it('should return "فروردین" for first month', () => {
		// 2024-04-01 = 1403/01/13
		expect(dateToMonthName(new Date("2024-04-01"))).toBe("فروردین");
	});

	it('should return "اسفند" for last month', () => {
		// 2025-03-01 = 1403/12/10
		expect(dateToMonthName(new Date("2025-03-01"))).toBe("اسفند");
	});
});

describe("dateToSeasonName", () => {
	it('should return "بهار" for spring', () => {
		expect(dateToSeasonName(new Date("2024-04-15"))).toBe("بهار");
	});

	it('should return "تابستان" for summer', () => {
		expect(dateToSeasonName(new Date("2024-07-15"))).toBe("تابستان");
	});

	it('should return "پاییز" for autumn', () => {
		expect(dateToSeasonName(new Date("2024-10-15"))).toBe("پاییز");
	});

	it('should return "زمستان" for winter', () => {
		expect(dateToSeasonName(new Date("2025-01-15"))).toBe("زمستان");
	});
});

describe("dateToDayOfMonth", () => {
	it("should return 1 for first day of Farvardin 1403", () => {
		expect(dateToDayOfMonth(new Date("2024-03-20"))).toBe(1);
	});

	it("should return a value between 1 and 31", () => {
		const day = dateToDayOfMonth(new Date("2024-06-15"));
		expect(day).toBeGreaterThanOrEqual(1);
		expect(day).toBeLessThanOrEqual(31);
	});
});

describe("dateToDaysPassedJYear", () => {
	it("should return 1 for the first day of the year", () => {
		expect(dateToDaysPassedJYear(new Date("2024-03-20"))).toBe(1);
	});

	it("should return 2 for the second day of the year", () => {
		expect(dateToDaysPassedJYear(new Date("2024-03-21"))).toBe(2);
	});
});

describe("dateToDaysRemainingJYear", () => {
	it("should return 364 for the first day of a non-leap year", () => {
		// 1404 starts 2025-03-21, which is non-leap (365 days)
		expect(dateToDaysRemainingJYear(new Date("2025-03-21"))).toBe(364);
	});

	it("passed + remaining should equal total days in year", () => {
		const date = new Date("2024-07-10");
		const passed = dateToDaysPassedJYear(date);
		const remaining = dateToDaysRemainingJYear(date);
		const { jy } = dateToJalali(date);
		const total = getDaysInJalaliYear(jy);
		expect(passed + remaining).toBe(total);
	});
});

describe("dateToDaysPassedSeason", () => {
	it("should return 1 on the first day of Spring (Farvardin 1)", () => {
		expect(dateToDaysPassedSeason(new Date("2024-03-20"))).toBe(1);
	});

	it("should return a non-negative number", () => {
		expect(dateToDaysPassedSeason(new Date("2024-05-15"))).toBeGreaterThanOrEqual(0);
	});
});

describe("dateToDaysRemainingSeason", () => {
	it("should return a non-negative number", () => {
		expect(dateToDaysRemainingSeason(new Date("2024-05-15"))).toBeGreaterThanOrEqual(0);
	});

	it("passed + remaining should equal total days in the season minus 1", () => {
		const date = new Date("2024-05-15");
		const passed = dateToDaysPassedSeason(date);
		const remaining = dateToDaysRemainingSeason(date);
		// Spring = 3 months × 31 days = 93 days
		expect(passed + remaining).toBe(93);
	});
});

describe("dateToDaysPassedJMonth", () => {
	it("should return 1 for the first day of a month", () => {
		expect(dateToDaysPassedJMonth(new Date("2024-03-20"))).toBe(1);
	});

	it("should return 14 for the 15th day of a month", () => {
		// 2024-04-03 = 1403/01/15
		expect(dateToDaysPassedJMonth(new Date("2024-04-02"))).toBe(14);
	});
});

describe("dateToDaysRemainingJMonth", () => {
	it("should return 30 for the first day of a 31-day month", () => {
		// 1403/01/01 → month has 31 days → remaining = 30
		expect(dateToDaysRemainingJMonth(new Date("2024-03-20"))).toBe(30);
	});

	it("passed + remaining should equal month length minus 1", () => {
		const date = new Date("2024-03-25");
		const passed = dateToDaysPassedJMonth(date);
		const remaining = dateToDaysRemainingJMonth(date);
		expect(passed + remaining).toBe(jalaliMonthLength(1403, 2));
	});
});

describe("dateToStartDayOfJMonthDate", () => {
	it("should return a Date with jd = 1", () => {
		const start = dateToStartDayOfJMonthDate(new Date("2024-05-10"));
		expect(dateToJalali(start).jd).toBe(1);
	});

	it("should be in the same Jalali month as the input", () => {
		const input = new Date("2024-05-10");
		const start = dateToStartDayOfJMonthDate(input);
		expect(dateToJalali(start).jm).toBe(dateToJalali(input).jm);
	});
});

describe("dateToEndDayOfJMonthDate", () => {
	it("should return the last day of the month", () => {
		const input = new Date("2024-04-15"); // somewhere in Farvardin
		const end = dateToEndDayOfJMonthDate(input);
		const { jy, jm, jd } = dateToJalali(end);
		expect(jd).toBe(jalaliMonthLength(jy, jm));
	});
});

describe("dateToStartDayOfSeasonDate", () => {
	it("should return Farvardin 1 for a Spring date", () => {
		const start = dateToStartDayOfSeasonDate(new Date("2024-05-01"));
		const { jm, jd } = dateToJalali(start);
		expect(jm).toBe(1);
		expect(jd).toBe(1);
	});
});

describe("dateToEndDayOfSeasonDate", () => {
	it("should return Khordad 31 for a Spring date", () => {
		const end = dateToEndDayOfSeasonDate(new Date("2024-05-01"));
		const { jm, jd } = dateToJalali(end);
		expect(jm).toBe(3);
		expect(jd).toBe(31);
	});

	it("should return the last day of Winter (Esfand 29 or 30)", () => {
		const end = dateToEndDayOfSeasonDate(new Date("2025-01-15"));
		const { jy, jm, jd } = dateToJalali(end);
		expect(jm).toBe(12);
		expect(jd).toBe(jalaliMonthLength(jy, 12));
	});
});

describe("jalaliMonthToGregorianRange", () => {
	it("should return firstDay and lastDay", () => {
		const range = jalaliMonthToGregorianRange(1403, 1);
		expect(range).toHaveProperty("firstDay");
		expect(range).toHaveProperty("lastDay");
	});

	it("firstDay of Farvardin 1403 should be 2024/03/20", () => {
		const { firstDay } = jalaliMonthToGregorianRange(1403, 1);
		expect(firstDay.gy).toBe(2024);
		expect(firstDay.gm).toBe(3);
		expect(firstDay.gd).toBe(20);
	});

	it("lastDay of Farvardin 1403 should be 2024/04/19", () => {
		const { lastDay } = jalaliMonthToGregorianRange(1403, 1);
		expect(lastDay.gy).toBe(2024);
		expect(lastDay.gm).toBe(4);
		expect(lastDay.gd).toBe(19);
	});
});

describe("jalaliMonthToHijriRange", () => {
	it("should return firstDay and lastDay", () => {
		const range = jalaliMonthToHijriRange(1403, 1);
		expect(range).toHaveProperty("firstDay");
		expect(range).toHaveProperty("lastDay");
	});

	it("firstDay should come before lastDay", () => {
		const { firstDay, lastDay } = jalaliMonthToHijriRange(1403, 6);

		const first = hijriToDate(firstDay.hy, firstDay.hm, firstDay.hd);
		const last = hijriToDate(lastDay.hy, lastDay.hm, lastDay.hd);

		expect(first.getTime()).toBeLessThan(last.getTime());
	});
});
