import { CalendarDate, parseDate, today } from "@internationalized/date";
import {
	addCalendarDays,
	dateToGregorian,
	dateToWeekdayName,
	getWeekdayTehran,
	gregorianMonthLength,
	gregorianToCalendarDate,
	jalaliMonthName,
	seasonName,
	todayTehran,
	weekStartNumber,
} from "src/utils/dateUtils/gregorianUtils";

describe("gregorianToCalendarDate", () => {
	it("should return a valid Date for a valid Gregorian date", () => {
		const date = gregorianToCalendarDate(2024, 3, 20);
		expect(date).toBeInstanceOf(CalendarDate);
		expect(date.year).toBe(2024);
		expect(date.month).toBe(3);
		expect(date.day).toBe(20);
	});

	it("should handle Feb 29 in a leap year", () => {
		const date = gregorianToCalendarDate(2024, 2, 29);
		expect(date).not.toBeNull();
		expect(date.day).toBe(29);
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

describe("jalaliMonthName", () => {
	const expectedNames = [
		"فروردین",
		"اردیبهشت",
		"خرداد",
		"تیر",
		"مرداد",
		"شهریور",
		"مهر",
		"آبان",
		"آذر",
		"دی",
		"بهمن",
		"اسفند",
	];

	expectedNames.forEach((name, index) => {
		it(`should return "${name}" for month ${index + 1}`, () => {
			expect(jalaliMonthName(index + 1)).toBe(name);
		});
	});
});

describe("gregorianMonthLength", () => {
	it("should return 31 for January", () => {
		expect(gregorianMonthLength(2024, 1)).toBe(31);
	});

	it("should return 28 for February in a non-leap year", () => {
		expect(gregorianMonthLength(2023, 2)).toBe(28);
	});

	it("should return 29 for February in a leap year", () => {
		expect(gregorianMonthLength(2024, 2)).toBe(29);
	});

	it("should return 30 for April", () => {
		expect(gregorianMonthLength(2024, 4)).toBe(30);
	});

	it("should return 31 for December", () => {
		expect(gregorianMonthLength(2024, 12)).toBe(31);
	});
});

describe("seasonName", () => {
	it('should return "بهار" for season 1', () => {
		expect(seasonName(1)).toBe("بهار");
	});

	it('should return "تابستان" for season 2', () => {
		expect(seasonName(2)).toBe("تابستان");
	});

	it('should return "پاییز" for season 3', () => {
		expect(seasonName(3)).toBe("پاییز");
	});

	it('should return "زمستان" for season 4', () => {
		expect(seasonName(4)).toBe("زمستان");
	});
});

describe("dateToGregorian", () => {
	it("should extract year, month, day correctly", () => {
		const { gy, gm, gd } = dateToGregorian(parseDate("2024-06-15"));
		expect(gy).toBe(2024);
		expect(gm).toBe(6);
		expect(gd).toBe(15);
	});

	it("should handle month/day boundaries correctly", () => {
		const { gy, gm, gd } = dateToGregorian(parseDate("2024-01-01"));
		expect(gy).toBe(2024);
		expect(gm).toBe(1);
		expect(gd).toBe(1);
	});

	it("should handle December 31", () => {
		const { gy, gm, gd } = dateToGregorian(parseDate("2024-12-31"));
		expect(gy).toBe(2024);
		expect(gm).toBe(12);
		expect(gd).toBe(31);
	});
});

describe("dateToWeekdayName", () => {
	it("should return the correct Persian weekday name", () => {
		const validNames = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
		const name = dateToWeekdayName(parseDate("2024-06-15"));
		expect(validNames).toContain(name);
	});

	it('should return "شنبه" for a Saturday', () => {
		// 2024-03-23 is a Saturday
		expect(dateToWeekdayName(parseDate("2024-03-23"))).toBe("شنبه");
	});

	it('should return "جمعه" for a Friday', () => {
		// 2024-03-22 is a Friday
		expect(dateToWeekdayName(parseDate("2024-03-22"))).toBe("جمعه");
	});
});

describe("addCalendarDays", () => {
	it("should add days correctly", () => {
		const base = parseDate("2024-01-01");
		const result = addCalendarDays(base, 10);
		const { gy, gm, gd } = dateToGregorian(result);
		expect(gy).toBe(2024);
		expect(gm).toBe(1);
		expect(gd).toBe(11);
	});

	it("should subtract days when given negative value", () => {
		const base = parseDate("2024-01-11");
		const result = addCalendarDays(base, -10);
		const { gy, gm, gd } = dateToGregorian(result);
		expect(gy).toBe(2024);
		expect(gm).toBe(1);
		expect(gd).toBe(1);
	});

	it("should handle month overflow correctly", () => {
		const base = parseDate("2024-01-28");
		const result = addCalendarDays(base, 5);
		const { gm, gd } = dateToGregorian(result);
		expect(gm).toBe(2);
		expect(gd).toBe(2);
	});

	it("should return a new Date object, not mutate the original", () => {
		const base = parseDate("2024-06-01");
		const originalDate = base.toString();
		addCalendarDays(base, 5);
		expect(base.toString()).toBe(originalDate);
	});

	it("should return the same date when adding 0 days", () => {
		const base = parseDate("2024-06-15");
		const result = addCalendarDays(base, 0);
		expect(dateToGregorian(result)).toEqual(dateToGregorian(base));
	});
});

describe("getWeekdayTehran", () => {
	it("should return a number between 0 and 6", () => {
		const weekday = getWeekdayTehran(parseDate("2024-06-15"));
		expect(weekday).toBeGreaterThanOrEqual(0);
		expect(weekday).toBeLessThanOrEqual(6);
	});

	it("should be consistent across calls for the same date", () => {
		const date = parseDate("2024-03-20");
		expect(getWeekdayTehran(date)).toBe(getWeekdayTehran(date));
	});
});

describe("todayTehran", () => {
	it("should return a Date instance", () => {
		expect(todayTehran()).toBeInstanceOf(CalendarDate);
	});

	it("returns today's date in Tehran without a time component", () => {
		expect(todayTehran().toString()).toBe(today("Asia/Tehran").toString());
		expect("hour" in todayTehran()).toBe(false);
	});
});
