import { describe, it, expect } from "vitest";
import {
	todayTehran,
	gregorianToDate,
	weekStartNumber,
	dateToGregorian,
	dateToWeekdayName,
	getWeekdayTehran,
	addDayDate,
	jalaliToSeason,
	jalaliMonthName,
	seasonName,
} from "src/utils/dateUtils/gregorianUtils";

describe("gregorianToDate", () => {
	it("should create a Date object from Gregorian date components", () => {
		const date = gregorianToDate(2024, 3, 15);
		expect(date.getUTCFullYear()).toBe(2024);
		expect(date.getUTCMonth()).toBe(2); // 0-indexed
		expect(date.getUTCDate()).toBe(15);
	});

	it("should handle year boundaries correctly", () => {
		const date = gregorianToDate(2023, 12, 31);
		expect(date.getUTCFullYear()).toBe(2023);
		expect(date.getUTCMonth()).toBe(11);
		expect(date.getUTCDate()).toBe(31);
	});

	it("should handle leap year dates", () => {
		const date = gregorianToDate(2024, 2, 29);
		expect(date.getUTCFullYear()).toBe(2024);
		expect(date.getUTCMonth()).toBe(1);
		expect(date.getUTCDate()).toBe(29);
	});

	it("should set time to noon UTC", () => {
		const date = gregorianToDate(2024, 1, 1);
		expect(date.getUTCHours()).toBe(12);
		expect(date.getUTCMinutes()).toBe(0);
		expect(date.getUTCSeconds()).toBe(0);
	});
});

describe("dateToGregorian", () => {
	it("should convert Date to Gregorian object", () => {
		const date = new Date(Date.UTC(2024, 2, 15, 12, 0, 0));
		const result = dateToGregorian(date);
		expect(result).toEqual({
			gy: 2024,
			gm: 3,
			gd: 15,
		});
	});

	it("should handle different dates correctly", () => {
		const date = new Date(Date.UTC(2023, 11, 31, 12, 0, 0));
		const result = dateToGregorian(date);
		expect(result.gy).toBe(2023);
		expect(result.gm).toBe(12);
		expect(result.gd).toBe(31);
	});

	it("should handle beginning of year", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = dateToGregorian(date);
		expect(result).toEqual({
			gy: 2024,
			gm: 1,
			gd: 1,
		});
	});

	it("should round-trip with gregorianToDate", () => {
		const original = { gy: 2024, gm: 6, gd: 20 };
		const date = gregorianToDate(original.gy, original.gm, original.gd);
		const result = dateToGregorian(date);
		expect(result).toEqual(original);
	});
});

describe("weekStartNumber", () => {
	it("should return 6 for Saturday", () => {
		expect(weekStartNumber("sat")).toBe(6);
	});

	it("should return 0 for Sunday", () => {
		expect(weekStartNumber("sun")).toBe(0);
	});

	it("should return 1 for Monday", () => {
		expect(weekStartNumber("mon")).toBe(1);
	});
});

describe("dateToWeekdayName", () => {
	it("should return Persian weekday name for fa locale", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // Monday
		const result = dateToWeekdayName(date, "fa");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should return English weekday name for en locale", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // Monday
		const result = dateToWeekdayName(date, "en");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should default to fa locale when not specified", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const resultDefault = dateToWeekdayName(date);
		const resultFa = dateToWeekdayName(date, "fa");
		expect(resultDefault).toBe(resultFa);
	});

	it("should handle different dates", () => {
		const saturday = new Date(Date.UTC(2024, 0, 6, 12, 0, 0));
		const sunday = new Date(Date.UTC(2024, 0, 7, 12, 0, 0));

		const satName = dateToWeekdayName(saturday, "en");
		const sunName = dateToWeekdayName(sunday, "en");

		expect(satName).not.toBe(sunName);
	});
});

describe("getWeekdayTehran", () => {
	it("should return number between 0 and 6", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = getWeekdayTehran(date);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(6);
	});

	it("should return consistent values for same weekday", () => {
		const date1 = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // Monday
		const date2 = new Date(Date.UTC(2024, 0, 8, 12, 0, 0)); // Next Monday

		expect(getWeekdayTehran(date1)).toBe(getWeekdayTehran(date2));
	});

	it("should return different values for different weekdays", () => {
		const monday = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const tuesday = new Date(Date.UTC(2024, 0, 2, 12, 0, 0));

		expect(getWeekdayTehran(monday)).not.toBe(getWeekdayTehran(tuesday));
	});

	it("should handle year boundaries", () => {
		const lastDay = new Date(Date.UTC(2023, 11, 31, 12, 0, 0));
		const firstDay = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));

		const result1 = getWeekdayTehran(lastDay);
		const result2 = getWeekdayTehran(firstDay);

		expect(typeof result1).toBe("number");
		expect(typeof result2).toBe("number");
	});
});

describe("addDayDate", () => {
	it("should add positive days to a date", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = addDayDate(date, 5);

		expect(result.getUTCDate()).toBe(6);
		expect(result.getUTCMonth()).toBe(0);
		expect(result.getUTCFullYear()).toBe(2024);
	});

	it("should subtract days with negative input", () => {
		const date = new Date(Date.UTC(2024, 0, 10, 12, 0, 0));
		const result = addDayDate(date, -5);

		expect(result.getUTCDate()).toBe(5);
		expect(result.getUTCMonth()).toBe(0);
	});

	it("should handle zero days", () => {
		const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
		const result = addDayDate(date, 0);

		expect(result.getTime()).toBe(date.getTime());
	});

	it("should handle month boundaries", () => {
		const date = new Date(Date.UTC(2024, 0, 30, 12, 0, 0));
		const result = addDayDate(date, 5);

		expect(result.getUTCDate()).toBe(4);
		expect(result.getUTCMonth()).toBe(1); // February
	});

	it("should handle year boundaries", () => {
		const date = new Date(Date.UTC(2023, 11, 30, 12, 0, 0));
		const result = addDayDate(date, 5);

		expect(result.getUTCDate()).toBe(4);
		expect(result.getUTCMonth()).toBe(0);
		expect(result.getUTCFullYear()).toBe(2024);
	});

	it("should handle leap year dates", () => {
		const date = new Date(Date.UTC(2024, 1, 28, 12, 0, 0)); // Feb 28, 2024
		const result = addDayDate(date, 1);

		expect(result.getUTCDate()).toBe(29); // Leap year
		expect(result.getUTCMonth()).toBe(1);
	});

	it("should not mutate original date", () => {
		const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
		const originalTime = date.getTime();

		addDayDate(date, 10);

		expect(date.getTime()).toBe(originalTime);
	});

	it("should handle large day additions", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = addDayDate(date, 365);

		expect(result.getUTCFullYear()).toBe(2024); // 2024 is leap year
		expect(result.getUTCMonth()).toBe(11);
		expect(result.getUTCDate()).toBe(31);
	});
});

describe("jalaliToSeason", () => {
	it("should return 1 for months 1-3 (spring)", () => {
		expect(jalaliToSeason(1)).toBe(1);
		expect(jalaliToSeason(2)).toBe(1);
		expect(jalaliToSeason(3)).toBe(1);
	});

	it("should return 2 for months 4-6 (summer)", () => {
		expect(jalaliToSeason(4)).toBe(2);
		expect(jalaliToSeason(5)).toBe(2);
		expect(jalaliToSeason(6)).toBe(2);
	});

	it("should return 3 for months 7-9 (fall)", () => {
		expect(jalaliToSeason(7)).toBe(3);
		expect(jalaliToSeason(8)).toBe(3);
		expect(jalaliToSeason(9)).toBe(3);
	});

	it("should return 4 for months 10-12 (winter)", () => {
		expect(jalaliToSeason(10)).toBe(4);
		expect(jalaliToSeason(11)).toBe(4);
		expect(jalaliToSeason(12)).toBe(4);
	});
});

describe("jalaliMonthName", () => {
	it("should return month name for valid month number in fa", () => {
		const result = jalaliMonthName(1, "fa");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should return month name for valid month number in en", () => {
		const result = jalaliMonthName(1, "en");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should default to fa locale when not specified", () => {
		const resultDefault = jalaliMonthName(1);
		const resultFa = jalaliMonthName(1, "fa");
		expect(resultDefault).toBe(resultFa);
	});

	it("should handle all 12 months", () => {
		for (let i = 1; i <= 12; i++) {
			const result = jalaliMonthName(i, "fa");
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		}
	});

	it("should throw error for month number less than 1", () => {
		expect(() => jalaliMonthName(0)).toThrow("month number is not currect!");
	});

	it("should throw error for month number greater than 12", () => {
		expect(() => jalaliMonthName(13)).toThrow("month number is not currect!");
	});

	it("should throw error for negative month numbers", () => {
		expect(() => jalaliMonthName(-1)).toThrow("month number is not currect!");
	});
});

describe("seasonName", () => {
	it("should return season name for valid season number in fa", () => {
		const result = seasonName(1, "fa");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should return season name for valid season number in en", () => {
		const result = seasonName(1, "en");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("should default to fa locale when not specified", () => {
		const resultDefault = seasonName(1);
		const resultFa = seasonName(1, "fa");
		expect(resultDefault).toBe(resultFa);
	});

	it("should handle all 4 seasons", () => {
		for (let i = 1; i <= 4; i++) {
			const result = seasonName(i, "fa");
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		}
	});

	it("should throw error for season number less than 1", () => {
		expect(() => seasonName(0)).toThrow("season number is not currect!");
	});

	it("should throw error for season number greater than 4", () => {
		expect(() => seasonName(5)).toThrow("season number is not currect!");
	});

	it("should throw error for negative season numbers", () => {
		expect(() => seasonName(-1)).toThrow("season number is not currect!");
	});
});

describe("todayTehran", () => {
	it("should return a Date object", () => {
		const result = todayTehran();
		expect(result).toBeInstanceOf(Date);
	});

	it("should have time set to noon UTC", () => {
		const result = todayTehran();
		expect(result.getUTCHours()).toBe(12);
		expect(result.getUTCMinutes()).toBe(0);
		expect(result.getUTCSeconds()).toBe(0);
	});

	it("should return valid date components", () => {
		const result = todayTehran();
		const year = result.getUTCFullYear();
		const month = result.getUTCMonth();
		const day = result.getUTCDate();

		expect(year).toBeGreaterThan(2020);
		expect(month).toBeGreaterThanOrEqual(0);
		expect(month).toBeLessThanOrEqual(11);
		expect(day).toBeGreaterThanOrEqual(1);
		expect(day).toBeLessThanOrEqual(31);
	});
});
