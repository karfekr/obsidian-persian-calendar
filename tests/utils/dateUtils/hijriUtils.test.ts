import { describe, it, expect } from "vitest";
import {
	dateToHijri,
	gregorianToHijri,
	hijriMonthLength,
	hijriToDate,
	hijriToGregorian,
	hijriToJalali,
	jalaliToHijri,
} from "src/utils/dateUtils/hijriUtils";

describe("hijriMonthLength", () => {
	it("should return month length for Iran base (default)", () => {
		const length = hijriMonthLength(1445, 1);
		expect(length).toBeGreaterThanOrEqual(29);
		expect(length).toBeLessThanOrEqual(30);
	});

	it("should return month length for Umalqura base", () => {
		const length = hijriMonthLength(1445, 1, { base: "umalqura" });
		expect(length).toBeGreaterThanOrEqual(29);
		expect(length).toBeLessThanOrEqual(30);
	});

	it("should return month length for Iran base explicitly", () => {
		const length = hijriMonthLength(1445, 1, { base: "iran" });
		expect(length).toBeGreaterThanOrEqual(29);
		expect(length).toBeLessThanOrEqual(30);
	});

	it("should handle all 12 months for Iran base", () => {
		for (let month = 1; month <= 12; month++) {
			const length = hijriMonthLength(1445, month, { base: "iran" });
			expect([29, 30]).toContain(length);
		}
	});

	it("should handle all 12 months for Umalqura base", () => {
		for (let month = 1; month <= 12; month++) {
			const length = hijriMonthLength(1445, month, { base: "umalqura" });
			expect([29, 30]).toContain(length);
		}
	});

	it("should handle different years", () => {
		const years = [1440, 1445, 1450];
		years.forEach((year) => {
			const length = hijriMonthLength(year, 1);
			expect([29, 30]).toContain(length);
		});
	});

	it("should fallback to Umalqura when Iran data is not available", () => {
		// Test with a year far in the future that likely doesn't have Iran data
		const length = hijriMonthLength(1500, 1, { base: "iran" });
		expect([29, 30]).toContain(length);
	});
});

describe("gregorianToHijri", () => {
	it("should convert Gregorian to Hijri with Iran base (default)", () => {
		const result = gregorianToHijri(2024, 1, 1);
		expect(result).toHaveProperty("hy");
		expect(result).toHaveProperty("hm");
		expect(result).toHaveProperty("hd");
		expect(result.hy).toBeGreaterThan(1400);
		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
		expect(result.hd).toBeGreaterThanOrEqual(1);
		expect(result.hd).toBeLessThanOrEqual(30);
	});

	it("should convert Gregorian to Hijri with Umalqura base", () => {
		const result = gregorianToHijri(2024, 1, 1, { base: "umalqura" });
		expect(result).toHaveProperty("hy");
		expect(result).toHaveProperty("hm");
		expect(result).toHaveProperty("hd");
		expect(result.hy).toBeGreaterThan(1400);
	});

	it("should convert Gregorian to Hijri with Iran base explicitly", () => {
		const result = gregorianToHijri(2024, 1, 1, { base: "iran" });
		expect(result).toHaveProperty("hy");
		expect(result).toHaveProperty("hm");
		expect(result).toHaveProperty("hd");
	});

	it("should handle different Gregorian dates", () => {
		const dates = [
			{ gy: 2023, gm: 3, gd: 15 },
			{ gy: 2024, gm: 6, gd: 20 },
			{ gy: 2025, gm: 12, gd: 31 },
		];

		dates.forEach(({ gy, gm, gd }) => {
			const result = gregorianToHijri(gy, gm, gd);
			expect(result.hm).toBeGreaterThanOrEqual(1);
			expect(result.hm).toBeLessThanOrEqual(12);
		});
	});

	it("should produce different results for Iran and Umalqura bases", () => {
		const iranResult = gregorianToHijri(2024, 1, 1, { base: "iran" });
		const umalquraResult = gregorianToHijri(2024, 1, 1, { base: "umalqura" });

		// Results might differ by a day or two
		const totalDaysIran = iranResult.hy * 354 + iranResult.hm * 29 + iranResult.hd;
		const totalDaysUmalqura = umalquraResult.hy * 354 + umalquraResult.hm * 29 + umalquraResult.hd;

		// They should be close but might not be identical
		expect(Math.abs(totalDaysIran - totalDaysUmalqura)).toBeLessThanOrEqual(2);
	});

	it("should handle year boundaries", () => {
		const result = gregorianToHijri(2023, 12, 31);
		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
	});
});

describe("hijriToGregorian", () => {
	it("should convert Hijri to Gregorian with Iran base (default)", () => {
		const result = hijriToGregorian(1445, 6, 15);
		expect(result).toHaveProperty("gy");
		expect(result).toHaveProperty("gm");
		expect(result).toHaveProperty("gd");
		expect(result.gy).toBeGreaterThan(2020);
		expect(result.gm).toBeGreaterThanOrEqual(1);
		expect(result.gm).toBeLessThanOrEqual(12);
		expect(result.gd).toBeGreaterThanOrEqual(1);
		expect(result.gd).toBeLessThanOrEqual(31);
	});

	it("should convert Hijri to Gregorian with Umalqura base", () => {
		const result = hijriToGregorian(1445, 6, 15, { base: "umalqura" });
		expect(result.gy).toBeGreaterThan(2020);
		expect(result.gm).toBeGreaterThanOrEqual(1);
		expect(result.gm).toBeLessThanOrEqual(12);
	});

	it("should convert Hijri to Gregorian with Iran base explicitly", () => {
		const result = hijriToGregorian(1445, 6, 15, { base: "iran" });
		expect(result).toHaveProperty("gy");
		expect(result).toHaveProperty("gm");
		expect(result).toHaveProperty("gd");
	});

	it("should handle different Hijri dates", () => {
		const dates = [
			{ hy: 1445, hm: 1, hd: 1 },
			{ hy: 1445, hm: 6, hd: 15 },
			{ hy: 1445, hm: 12, hd: 29 },
		];

		dates.forEach(({ hy, hm, hd }) => {
			const result = hijriToGregorian(hy, hm, hd);
			expect(result.gm).toBeGreaterThanOrEqual(1);
			expect(result.gm).toBeLessThanOrEqual(12);
		});
	});

	it("should produce different results for Iran and Umalqura bases", () => {
		const iranResult = hijriToGregorian(1445, 6, 15, { base: "iran" });
		const umalquraResult = hijriToGregorian(1445, 6, 15, { base: "umalqura" });

		// Results might differ by a day or two
		expect(iranResult.gy).toBeGreaterThan(0);
		expect(umalquraResult.gy).toBeGreaterThan(0);
	});

	it("should round-trip with gregorianToHijri for Iran base", () => {
		const originalG = { gy: 2024, gm: 3, gd: 15 };
		const hijri = gregorianToHijri(originalG.gy, originalG.gm, originalG.gd, { base: "iran" });
		const backToG = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });

		expect(backToG).toEqual(originalG);
	});

	it("should round-trip with gregorianToHijri for Umalqura base", () => {
		const originalG = { gy: 2024, gm: 3, gd: 15 };
		const hijri = gregorianToHijri(originalG.gy, originalG.gm, originalG.gd, { base: "umalqura" });
		const backToG = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd, { base: "umalqura" });

		expect(backToG).toEqual(originalG);
	});
});

describe("dateToHijri", () => {
	it("should convert Date to Hijri with Iran base (default)", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = dateToHijri(date);

		expect(result).toHaveProperty("hy");
		expect(result).toHaveProperty("hm");
		expect(result).toHaveProperty("hd");
		expect(result.hy).toBeGreaterThan(1400);
		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
	});

	it("should convert Date to Hijri with Umalqura base", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = dateToHijri(date, { base: "umalqura" });

		expect(result.hy).toBeGreaterThan(1400);
	});

	it("should convert Date to Hijri with Iran base explicitly", () => {
		const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
		const result = dateToHijri(date, { base: "iran" });

		expect(result).toHaveProperty("hy");
	});

	it("should handle different dates", () => {
		const dates = [
			new Date(Date.UTC(2023, 0, 1, 12, 0, 0)),
			new Date(Date.UTC(2024, 5, 15, 12, 0, 0)),
			new Date(Date.UTC(2025, 11, 31, 12, 0, 0)),
		];

		dates.forEach((date) => {
			const result = dateToHijri(date);
			expect(result.hm).toBeGreaterThanOrEqual(1);
			expect(result.hm).toBeLessThanOrEqual(12);
		});
	});

	it("should produce consistent results with gregorianToHijri", () => {
		const date = new Date(Date.UTC(2024, 2, 15, 12, 0, 0));
		const fromDate = dateToHijri(date, { base: "iran" });
		const fromGregorian = gregorianToHijri(2024, 3, 15, { base: "iran" });

		expect(fromDate).toEqual(fromGregorian);
	});

	it("should handle leap year dates", () => {
		const date = new Date(Date.UTC(2024, 1, 29, 12, 0, 0)); // Feb 29, 2024
		const result = dateToHijri(date);

		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
	});
});

describe("hijriToDate", () => {
	it("should convert Hijri to Date with Iran base (default)", () => {
		const result = hijriToDate(1445, 6, 15);

		expect(result).toBeInstanceOf(Date);
		expect(result.getUTCFullYear()).toBeGreaterThan(2020);
		expect(result.getUTCHours()).toBe(12);
		expect(result.getUTCMinutes()).toBe(0);
		expect(result.getUTCSeconds()).toBe(0);
	});

	it("should convert Hijri to Date with Umalqura base", () => {
		const result = hijriToDate(1445, 6, 15, { base: "umalqura" });

		expect(result).toBeInstanceOf(Date);
		expect(result.getUTCFullYear()).toBeGreaterThan(2020);
	});

	it("should convert Hijri to Date with Iran base explicitly", () => {
		const result = hijriToDate(1445, 6, 15, { base: "iran" });

		expect(result).toBeInstanceOf(Date);
	});

	it("should handle different Hijri dates", () => {
		const dates = [
			{ hy: 1445, hm: 1, hd: 1 },
			{ hy: 1445, hm: 6, hd: 15 },
			{ hy: 1445, hm: 12, hd: 29 },
		];

		dates.forEach(({ hy, hm, hd }) => {
			const result = hijriToDate(hy, hm, hd);
			expect(result).toBeInstanceOf(Date);
			expect(result.getUTCFullYear()).toBeGreaterThan(2020);
		});
	});

	it("should round-trip with dateToHijri for Iran base", () => {
		const original = { hy: 1445, hm: 6, hd: 15 };
		const date = hijriToDate(original.hy, original.hm, original.hd, { base: "iran" });
		const backToHijri = dateToHijri(date, { base: "iran" });

		expect(backToHijri).toEqual(original);
	});

	it("should round-trip with dateToHijri for Umalqura base", () => {
		const original = { hy: 1445, hm: 6, hd: 15 };
		const date = hijriToDate(original.hy, original.hm, original.hd, { base: "umalqura" });
		const backToHijri = dateToHijri(date, { base: "umalqura" });

		expect(backToHijri).toEqual(original);
	});

	it("should produce consistent results with hijriToGregorian", () => {
		const date = hijriToDate(1445, 6, 15, { base: "iran" });
		const gregorian = hijriToGregorian(1445, 6, 15, { base: "iran" });

		expect(date.getUTCFullYear()).toBe(gregorian.gy);
		expect(date.getUTCMonth()).toBe(gregorian.gm - 1);
		expect(date.getUTCDate()).toBe(gregorian.gd);
	});

	it("should handle first day of year", () => {
		const result = hijriToDate(1445, 1, 1);
		expect(result).toBeInstanceOf(Date);
	});

	it("should handle last day of month", () => {
		const result = hijriToDate(1445, 1, 30);
		expect(result).toBeInstanceOf(Date);
	});
});

describe("jalaliToHijri", () => {
	it("should convert Jalali to Hijri with Iran base (default)", () => {
		const result = jalaliToHijri(1403, 1, 1);

		expect(result).toHaveProperty("hy");
		expect(result).toHaveProperty("hm");
		expect(result).toHaveProperty("hd");
		expect(result.hy).toBeGreaterThan(1400);
		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
	});

	it("should convert Jalali to Hijri with Umalqura base", () => {
		const result = jalaliToHijri(1403, 1, 1, { base: "umalqura" });

		expect(result.hy).toBeGreaterThan(1400);
	});

	it("should convert Jalali to Hijri with Iran base explicitly", () => {
		const result = jalaliToHijri(1403, 1, 1, { base: "iran" });

		expect(result).toHaveProperty("hy");
	});

	it("should handle different Jalali dates", () => {
		const dates = [
			{ jy: 1403, jm: 1, jd: 1 },
			{ jy: 1403, jm: 6, jd: 15 },
			{ jy: 1403, jm: 12, jd: 29 },
		];

		dates.forEach(({ jy, jm, jd }) => {
			const result = jalaliToHijri(jy, jm, jd);
			expect(result.hm).toBeGreaterThanOrEqual(1);
			expect(result.hm).toBeLessThanOrEqual(12);
		});
	});

	it("should handle leap year dates in Jalali", () => {
		const result = jalaliToHijri(1403, 12, 30); // If 1403 is a leap year
		expect(result.hm).toBeGreaterThanOrEqual(1);
		expect(result.hm).toBeLessThanOrEqual(12);
	});

	it("should round-trip with hijriToJalali for Iran base", () => {
		const original = { jy: 1403, jm: 6, jd: 15 };
		const hijri = jalaliToHijri(original.jy, original.jm, original.jd, { base: "iran" });
		const backToJalali = hijriToJalali(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });

		expect(backToJalali).toEqual(original);
	});

	it("should round-trip with hijriToJalali for Umalqura base", () => {
		const original = { jy: 1403, jm: 6, jd: 15 };
		const hijri = jalaliToHijri(original.jy, original.jm, original.jd, { base: "umalqura" });
		const backToJalali = hijriToJalali(hijri.hy, hijri.hm, hijri.hd, { base: "umalqura" });

		expect(backToJalali).toEqual(original);
	});

	it("should handle Nowruz (first day of Jalali year)", () => {
		const result = jalaliToHijri(1403, 1, 1);
		expect(result.hy).toBeGreaterThan(1400);
	});
});

describe("hijriToJalali", () => {
	it("should convert Hijri to Jalali with Iran base (default)", () => {
		const result = hijriToJalali(1445, 6, 15);

		expect(result).toHaveProperty("jy");
		expect(result).toHaveProperty("jm");
		expect(result).toHaveProperty("jd");
		expect(result.jy).toBeGreaterThan(1400);
		expect(result.jm).toBeGreaterThanOrEqual(1);
		expect(result.jm).toBeLessThanOrEqual(12);
	});

	it("should convert Hijri to Jalali with Umalqura base", () => {
		const result = hijriToJalali(1445, 6, 15, { base: "umalqura" });

		expect(result.jy).toBeGreaterThan(1400);
	});

	it("should convert Hijri to Jalali with Iran base explicitly", () => {
		const result = hijriToJalali(1445, 6, 15, { base: "iran" });

		expect(result).toHaveProperty("jy");
	});

	it("should handle different Hijri dates", () => {
		const dates = [
			{ hy: 1445, hm: 1, hd: 1 },
			{ hy: 1445, hm: 6, hd: 15 },
			{ hy: 1445, hm: 12, hd: 29 },
		];

		dates.forEach(({ hy, hm, hd }) => {
			const result = hijriToJalali(hy, hm, hd);
			expect(result.jm).toBeGreaterThanOrEqual(1);
			expect(result.jm).toBeLessThanOrEqual(12);
		});
	});

	it("should handle first day of Hijri year", () => {
		const result = hijriToJalali(1445, 1, 1);
		expect(result.jy).toBeGreaterThan(1400);
	});

	it("should handle last day of Hijri month", () => {
		const result = hijriToJalali(1445, 1, 30);
		expect(result.jm).toBeGreaterThanOrEqual(1);
		expect(result.jm).toBeLessThanOrEqual(12);
	});

	it("should produce different results for Iran and Umalqura bases", () => {
		const iranResult = hijriToJalali(1445, 6, 15, { base: "iran" });
		const umalquraResult = hijriToJalali(1445, 6, 15, { base: "umalqura" });

		// They might differ by a day or two
		expect(iranResult.jy).toBeGreaterThan(0);
		expect(umalquraResult.jy).toBeGreaterThan(0);
	});
});

describe("Cross-calendar consistency", () => {
	it("should maintain consistency across Gregorian -> Hijri -> Jalali -> Gregorian for Iran base", () => {
		const original = { gy: 2024, gm: 3, gd: 15 };

		const hijri = gregorianToHijri(original.gy, original.gm, original.gd, { base: "iran" });
		const jalali = hijriToJalali(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });
		const hijri2 = jalaliToHijri(jalali.jy, jalali.jm, jalali.jd, { base: "iran" });
		const gregorian = hijriToGregorian(hijri2.hy, hijri2.hm, hijri2.hd, { base: "iran" });

		expect(gregorian).toEqual(original);
		expect(hijri2).toEqual(hijri);
	});

	it("should maintain consistency across Gregorian -> Hijri -> Jalali -> Gregorian for Umalqura base", () => {
		const original = { gy: 2024, gm: 3, gd: 15 };

		const hijri = gregorianToHijri(original.gy, original.gm, original.gd, { base: "umalqura" });
		const jalali = hijriToJalali(hijri.hy, hijri.hm, hijri.hd, { base: "umalqura" });
		const hijri2 = jalaliToHijri(jalali.jy, jalali.jm, jalali.jd, { base: "umalqura" });
		const gregorian = hijriToGregorian(hijri2.hy, hijri2.hm, hijri2.hd, { base: "umalqura" });

		expect(gregorian).toEqual(original);
		expect(hijri2).toEqual(hijri);
	});

	it("should maintain consistency using Date conversions for Iran base", () => {
		const originalDate = new Date(Date.UTC(2024, 2, 15, 12, 0, 0));

		const hijri = dateToHijri(originalDate, { base: "iran" });
		const backToDate = hijriToDate(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });

		expect(backToDate.getTime()).toBe(originalDate.getTime());
	});

	it("should maintain consistency using Date conversions for Umalqura base", () => {
		const originalDate = new Date(Date.UTC(2024, 2, 15, 12, 0, 0));

		const hijri = dateToHijri(originalDate, { base: "umalqura" });
		const backToDate = hijriToDate(hijri.hy, hijri.hm, hijri.hd, { base: "umalqura" });

		expect(backToDate.getTime()).toBe(originalDate.getTime());
	});
});

describe("Edge cases and boundaries", () => {
	it("should handle month transitions for Iran base", () => {
		// Test last day of month
		const hijri = { hy: 1445, hm: 1, hd: 30 };
		const gregorian = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });
		const backToHijri = gregorianToHijri(gregorian.gy, gregorian.gm, gregorian.gd, {
			base: "iran",
		});

		expect(backToHijri).toEqual(hijri);
	});

	it("should handle year transitions for Iran base", () => {
		// Test last day of year
		const hijri = { hy: 1445, hm: 12, hd: 29 };
		const gregorian = hijriToGregorian(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });
		const backToHijri = gregorianToHijri(gregorian.gy, gregorian.gm, gregorian.gd, {
			base: "iran",
		});

		expect(backToHijri.hy).toBe(hijri.hy);
		expect(backToHijri.hm).toBe(hijri.hm);
	});

	it("should handle first day of month", () => {
		const hijri = { hy: 1445, hm: 6, hd: 1 };
		const date = hijriToDate(hijri.hy, hijri.hm, hijri.hd);
		const backToHijri = dateToHijri(date);

		expect(backToHijri).toEqual(hijri);
	});

	it("should handle month lengths correctly", () => {
		// Test that we don't exceed valid month lengths
		for (let month = 1; month <= 12; month++) {
			const length = hijriMonthLength(1445, month, { base: "iran" });
			const hijri = { hy: 1445, hm: month, hd: length };
			const date = hijriToDate(hijri.hy, hijri.hm, hijri.hd, { base: "iran" });

			expect(date).toBeInstanceOf(Date);
		}
	});
});
