import {
	gregorianToHijri,
	hijriToGregorian,
	hijriToJalali,
	jalaliToHijri,
	dateToHijri,
	hijriMonthLength,
	hijriToDate,
} from "src/utils/dateUtils/hijriUtils";

describe("gregorianToHijri", () => {
	it("should convert 2024/03/20 to a valid Hijri date", () => {
		const { hy, hm, hd } = gregorianToHijri(2024, 3, 20);
		expect(hy).toBeGreaterThan(1400);
		expect(hm).toBeGreaterThanOrEqual(1);
		expect(hm).toBeLessThanOrEqual(12);
		expect(hd).toBeGreaterThanOrEqual(1);
		expect(hd).toBeLessThanOrEqual(30);
	});

	it("should return known conversion: 2024/03/20 → 1445/09/10 (approx)", () => {
		const { hy, hm } = gregorianToHijri(2024, 3, 20);
		// Ramadan 2024 started around March 10–11, Nowruz is 1445/09/10
		expect(hy).toBe(1445);
		expect(hm).toBe(9);
	});

	it("should convert 2000/01/01 to around 1420/09/24", () => {
		const { hy, hm } = gregorianToHijri(2000, 1, 1);
		expect(hy).toBe(1420);
		expect(hm).toBe(9);
	});
});

describe("hijriToGregorian", () => {
	it("should convert 1445/09/10 to a date around 2024/03", () => {
		const { gy, gm } = hijriToGregorian(1445, 9, 10);
		expect(gy).toBe(2024);
		expect(gm).toBe(3);
	});

	it("should round-trip correctly with gregorianToHijri", () => {
		const hijri = gregorianToHijri(2023, 6, 15);
		const { gy, gm, gd } = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd);
		expect(gy).toBe(2023);
		expect(gm).toBe(6);
		expect(gd).toBe(15);
	});

	it("should return valid Gregorian fields", () => {
		const { gy, gm, gd } = hijriToGregorian(1440, 1, 1);
		expect(gy).toBeGreaterThan(2000);
		expect(gm).toBeGreaterThanOrEqual(1);
		expect(gm).toBeLessThanOrEqual(12);
		expect(gd).toBeGreaterThanOrEqual(1);
		expect(gd).toBeLessThanOrEqual(31);
	});
});

describe("hijriToJalali", () => {
	it("should return valid Jalali fields", () => {
		const { jy, jm, jd } = hijriToJalali(1445, 9, 10);
		expect(jy).toBeGreaterThan(1400);
		expect(jm).toBeGreaterThanOrEqual(1);
		expect(jm).toBeLessThanOrEqual(12);
		expect(jd).toBeGreaterThanOrEqual(1);
		expect(jd).toBeLessThanOrEqual(31);
	});

	it("should round-trip correctly with jalaliToHijri", () => {
		const hijri = jalaliToHijri(1403, 6, 15);
		const { jy, jm, jd } = hijriToJalali(hijri.hy, hijri.hm, hijri.hd);
		expect(jy).toBe(1403);
		expect(jm).toBe(6);
		expect(jd).toBe(15);
	});
});

describe("jalaliToHijri", () => {
	it("should return valid Hijri fields", () => {
		const { hy, hm, hd } = jalaliToHijri(1403, 1, 1);
		expect(hy).toBeGreaterThan(1400);
		expect(hm).toBeGreaterThanOrEqual(1);
		expect(hm).toBeLessThanOrEqual(12);
		expect(hd).toBeGreaterThanOrEqual(1);
		expect(hd).toBeLessThanOrEqual(30);
	});

	it("should round-trip correctly with hijriToJalali", () => {
		const hijri = jalaliToHijri(1400, 12, 29);
		const { jy, jm, jd } = hijriToJalali(hijri.hy, hijri.hm, hijri.hd);
		expect(jy).toBe(1400);
		expect(jm).toBe(12);
		expect(jd).toBe(29);
	});
});

describe("dateToHijri", () => {
	it("should convert a Date object to Hijri", () => {
		const { hy, hm, hd } = dateToHijri(new Date("2024-03-20"));
		expect(hy).toBe(1445);
		expect(hm).toBe(9);
		expect(hd).toBeGreaterThanOrEqual(1);
	});

	it("should be consistent with gregorianToHijri", () => {
		const date = new Date("2023-10-10");
		const fromDate = dateToHijri(date);
		const fromGregorian = gregorianToHijri(2023, 10, 10);
		expect(fromDate.hy).toBe(fromGregorian.hy);
		expect(fromDate.hm).toBe(fromGregorian.hm);
		expect(fromDate.hd).toBe(fromGregorian.hd);
	});

	it("should return valid Hijri month range", () => {
		const { hm } = dateToHijri(new Date("2025-01-01"));
		expect(hm).toBeGreaterThanOrEqual(1);
		expect(hm).toBeLessThanOrEqual(12);
	});
});

describe("hijriMonthLength", () => {
	it("should return 29 or 30 days", () => {
		for (let hm = 1; hm <= 12; hm++) {
			const length = hijriMonthLength(1445, hm);
			expect([29, 30]).toContain(length);
		}
	});
});

describe("hijriToDate", () => {
	it("should return a Date object", () => {
		const date = hijriToDate(1445, 9, 10);
		expect(date).toBeInstanceOf(Date);
	});

	it("should be consistent with hijriToGregorian", () => {
		const { gy, gm, gd } = hijriToGregorian(1445, 1, 1);
		const date = hijriToDate(1445, 1, 1);
		expect(date.getUTCFullYear()).toBe(gy);
		expect(date.getUTCMonth() + 1).toBe(gm);
		expect(date.getUTCDate()).toBe(gd);
	});

	it("should round-trip with dateToHijri", () => {
		const originalDate = new Date("2024-07-07");
		const hijri = dateToHijri(originalDate);
		const backToDate = hijriToDate(hijri.hy, hijri.hm, hijri.hd);
		expect(backToDate.getUTCFullYear()).toBe(originalDate.getUTCFullYear());
		expect(backToDate.getUTCMonth()).toBe(originalDate.getUTCMonth());
		expect(backToDate.getUTCDate()).toBe(originalDate.getUTCDate());
	});
});
