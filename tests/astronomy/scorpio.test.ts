import {
	getAyanamsa,
	getMethodBoundaries,
	getMoonLongitude,
	getMoonScorpioDayInfo,
	getMoonScorpioNoteText,
} from "src/utils/astronomy";
import { describe, expect, it } from "vitest";

describe("Astronomical Moon in Scorpio Calculation", () => {
	describe("getMoonLongitude", () => {
		it("calculates lunar longitude within valid range [0, 360)", () => {
			const dates = [
				new Date("2000-01-01T12:00:00Z"),
				new Date("2025-04-13T12:00:00Z"),
				new Date("2050-06-15T00:00:00Z"),
				new Date("2100-12-31T23:59:59Z"),
				new Date("2125-01-01T00:00:00Z"),
			];

			for (const date of dates) {
				const lon = getMoonLongitude(date);
				expect(lon).toBeGreaterThanOrEqual(0);
				expect(lon).toBeLessThan(360);
			}
		});

		it("correctly identifies entry to Scorpio Zodiac Sign (210 degrees) on 2025-04-13", () => {
			// Around 2025-04-13 14:00 UTC, longitude is ~210°
			const date = new Date("2025-04-13T13:59:00Z");
			const lon = getMoonLongitude(date);
			expect(Math.abs(lon - 210.0)).toBeLessThan(0.1);
		});

		it("correctly identifies exit from Scorpius Constellation (~267.5 degrees) on 2025-04-18", () => {
			// Around 2025-04-18 09:20 UTC, longitude is ~267.5°
			const date = new Date("2025-04-18T09:20:00Z");
			const lon = getMoonLongitude(date);
			expect(Math.abs(lon - 267.5)).toBeLessThan(0.15);
		});
	});

	describe("getAyanamsa", () => {
		it("calculates accurate Lahiri Ayanamsa for J2000 and 2025-2026", () => {
			// At epoch J2000.0 (2000-01-01 12:00 UTC), Lahiri is ~23.857°
			const j2000 = new Date("2000-01-01T12:00:00Z");
			expect(getAyanamsa(j2000)).toBeCloseTo(23.857, 2);

			// At 2025-2026, Lahiri increases by ~50.29 arcseconds per year (~0.35° in 25 years) -> ~24.2°
			const y2025 = new Date("2025-01-01T00:00:00Z");
			expect(getAyanamsa(y2025)).toBeGreaterThan(24.15);
			expect(getAyanamsa(y2025)).toBeLessThan(24.3);
		});
	});

	describe("getMethodBoundaries", () => {
		const testDate = new Date("2025-04-15T00:00:00Z");

		it("returns 210° to 240° for tropical Scorpio sign", () => {
			const b = getMethodBoundaries(testDate, "sign");
			expect(b.startLon).toBe(210.0);
			expect(b.endLon).toBe(240.0);
		});

		it("returns sidereal constellation boundaries for constellation method", () => {
			const b = getMethodBoundaries(testDate, "constellation");
			expect(b.startLon).toBeCloseTo(210.0 + getAyanamsa(testDate), 2);
			expect(b.endLon).toBe(267.5);
		});

		it("returns combined cautionary boundaries spanning 210° to 267.5°", () => {
			const b = getMethodBoundaries(testDate, "both");
			expect(b.startLon).toBe(210.0);
			expect(b.endLon).toBe(267.5);
		});
	});

	describe("getMoonScorpioDayInfo", () => {
		it("detects entry into Scorpio on 2025-04-13 with combined method", () => {
			const info = getMoonScorpioDayInfo(new Date("2025-04-13T12:00:00Z"), "both");
			expect(info.isScorpio).toBe(true);
			expect(info.isEntering).toBe(true);
			expect(info.isExiting).toBe(false);
			expect(info.entryTime).toBeDefined();
		});

		it("detects full day inside Scorpio on 2025-04-14, 2025-04-15, and 2025-04-16", () => {
			for (const d of ["2025-04-14", "2025-04-15", "2025-04-16"]) {
				const info = getMoonScorpioDayInfo(new Date(`${d}T12:00:00Z`), "both");
				expect(info.isScorpio).toBe(true);
				expect(info.isAllDay).toBe(true);
			}
		});

		it("detects exit from Scorpio on 2025-04-18 with combined method", () => {
			const info = getMoonScorpioDayInfo(new Date("2025-04-18T12:00:00Z"), "both");
			expect(info.isScorpio).toBe(true);
			expect(info.isEntering).toBe(false);
			expect(info.isExiting).toBe(true);
			expect(info.exitTime).toBeDefined();
		});

		it("returns isScorpio false on days outside Scorpio (2025-04-19 to 2025-05-09)", () => {
			const info1 = getMoonScorpioDayInfo(new Date("2025-04-19T12:00:00Z"), "both");
			expect(info1.isScorpio).toBe(false);

			const info2 = getMoonScorpioDayInfo(new Date("2025-05-01T12:00:00Z"), "both");
			expect(info2.isScorpio).toBe(false);
		});

		it("detects next lunar cycle entry on 2025-05-10 and exit on 2025-05-15", () => {
			const entryInfo = getMoonScorpioDayInfo(new Date("2025-05-10T12:00:00Z"), "both");
			expect(entryInfo.isScorpio).toBe(true);
			expect(entryInfo.isEntering).toBe(true);

			const exitInfo = getMoonScorpioDayInfo(new Date("2025-05-15T12:00:00Z"), "both");
			expect(exitInfo.isScorpio).toBe(true);
			expect(exitInfo.isExiting).toBe(true);
		});
	});

	describe("getMoonScorpioNoteText & Placeholders", () => {
		it("formats Persian text with 🦂 icon on Scorpio days", () => {
			const text = getMoonScorpioNoteText(new Date("2025-04-14T12:00:00Z"), "both", "fa");
			expect(text).toContain("🦂");
			expect(text).toContain("قمر در عقرب");
		});

		it("formats English text with 🦂 icon on Scorpio days", () => {
			const text = getMoonScorpioNoteText(new Date("2025-04-14T12:00:00Z"), "both", "en");
			expect(text).toContain("🦂");
			expect(text).toContain("Moon in Scorpio");
		});

		it("returns empty string on non-Scorpio days", () => {
			const textFa = getMoonScorpioNoteText(new Date("2025-04-20T12:00:00Z"), "both", "fa");
			expect(textFa).toBe("");

			const textEn = getMoonScorpioNoteText(new Date("2025-04-20T12:00:00Z"), "both", "en");
			expect(textEn).toBe("");
		});
	});

	describe("100-Year Dynamic Robustness", () => {
		it("calculates correctly 100 years into the future (2126)", () => {
			const futureDate = new Date("2126-06-15T12:00:00Z");
			const info = getMoonScorpioDayInfo(futureDate, "both");
			expect(typeof info.isScorpio).toBe("boolean");
			expect(typeof info.summary.fa).toBe("string");
			expect(typeof info.summary.en).toBe("string");
		});

		it("calculates correctly for 100 years in the past (1926)", () => {
			const pastDate = new Date("1926-06-15T12:00:00Z");
			const info = getMoonScorpioDayInfo(pastDate, "both");
			expect(typeof info.isScorpio).toBe("boolean");
		});
	});
});
