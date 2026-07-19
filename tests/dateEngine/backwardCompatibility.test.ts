import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { formatPattern } from "src/utils/dateEngine/formatter";
import { parsePattern } from "src/utils/dateEngine/parser";

beforeEach(() => {
	clearCompiledPatternCache();
});

describe("backward compatibility - filename generation", () => {
	it("daily jalali: `${jy}-${jm.pad}-${jd.pad}` == pattern jYYYY-jMM-jDD", () => {
		const legacy = (jy: number, jm: number, jd: number) =>
			`${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}`;

		expect(formatPattern("jYYYY-jMM-jDD", { jy: 1403, jm: 1, jd: 5 })).toBe(legacy(1403, 1, 5));
		expect(formatPattern("jYYYY-jMM-jDD", { jy: 1403, jm: 12, jd: 29 })).toBe(legacy(1403, 12, 29));
	});

	it("daily gregorian fallback: `${gy}-${gm.pad}-${gd.pad}` == pattern YYYY-MM-DD", () => {
		const legacy = (gy: number, gm: number, gd: number) =>
			`${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}`;

		expect(formatPattern("YYYY-MM-DD", { gy: 2026, gm: 3, gd: 9 })).toBe(legacy(2026, 3, 9));
	});

	it("weekly: `${jy}-W${weekNumber}` (unpadded) == pattern jYYYY-[W]W", () => {
		const legacy = (jy: number, weekNumber: number) => `${jy}-W${weekNumber}`;

		expect(formatPattern("jYYYY-[W]W", { jy: 1403, week: 7 })).toBe(legacy(1403, 7));
		expect(formatPattern("jYYYY-[W]W", { jy: 1403, week: 23 })).toBe(legacy(1403, 23));
	});

	it("monthly: `${jy}-${jm.pad}` == pattern jYYYY-jMM", () => {
		const legacy = (jy: number, jm: number) => `${jy}-${jm.toString().padStart(2, "0")}`;

		expect(formatPattern("jYYYY-jMM", { jy: 1403, jm: 7 })).toBe(legacy(1403, 7));
	});

	it("seasonal: `${jy}-S${seasonNumber}` (unpadded) == pattern jYYYY-[S]Q", () => {
		const legacy = (jy: number, seasonNumber: number) => `${jy}-S${seasonNumber}`;

		expect(formatPattern("jYYYY-[S]Q", { jy: 1403, season: 3 })).toBe(legacy(1403, 3));
	});

	it("yearly: `${jy}` == pattern jYYYY", () => {
		expect(formatPattern("jYYYY", { jy: 1403 })).toBe("1403");
	});
});

describe("backward compatibility - folder token substitution", () => {
	it("reproduces today's resolvePathTokens behavior for jYYYY", () => {
		expect(formatPattern("Journal/jYYYY/[Daily]", { jy: 1403 })).toBe("Journal/1403/Daily");
	});

	it("reproduces today's resolvePathTokens behavior for jMM/jM/jMMMM together", () => {
		expect(formatPattern("Journal/jYYYY/jMM-jMMMM", { jy: 1403, jm: 1 }, "fa")).toBe(
			"Journal/1403/01-فروردین",
		);
	});

	it("reproduces today's resolvePathTokens behavior for season tokens (jQQQQ/jQQ/jQ)", () => {
		expect(formatPattern("Journal/jYYYY/jQQQQ", { jy: 1403, season: 1 }, "fa")).toBe(
			"Journal/1403/بهار",
		);
	});

	it("default settings folder patterns round-trip unchanged when no per-note customization happens", () => {
		// These mirror DEFAULT_SETTING's dailyNotesPath/monthlyNotesPath/etc.
		// Note: the literal suffixes must be [bracket]-escaped, because "D",
		// "M" and "W" are themselves single-letter tokens (day/month/week) -
		// see the "single-letter token collisions" edge case tests below for
		// why an unescaped "Journal/jYYYY/Daily" is NOT safe to use as-is.
		const defaults: Array<[string, Record<string, number>, string]> = [
			["Journal/jYYYY/[Daily]", { jy: 1403 }, "Journal/1403/Daily"],
			["Journal/jYYYY/[Weekly]", { jy: 1403 }, "Journal/1403/Weekly"],
			["Journal/jYYYY/[Monthly]", { jy: 1403 }, "Journal/1403/Monthly"],
			["Journal/jYYYY/[Seasonal]", { jy: 1403 }, "Journal/1403/Seasonal"],
			["Journal/jYYYY", { jy: 1403 }, "Journal/1403"],
		];

		for (const [pattern, ctx, expected] of defaults) {
			expect(formatPattern(pattern, ctx)).toBe(expected);
		}
	});
});

describe("backward compatibility - filename parsing", () => {
	it("matches the old strict isDailyRegex behavior: requires exactly 4-2-2 digits", () => {
		// Old regex: /^(\d{4})-(\d{2})-(\d{2})$/
		expect(parsePattern("jYYYY-jMM-jDD", "1403-01-05")).toEqual({ jy: 1403, jm: 1, jd: 5 });
		expect(parsePattern("jYYYY-jMM-jDD", "1403-1-5")).toBeNull();
		expect(parsePattern("jYYYY-jMM-jDD", "not-a-date")).toBeNull();
	});
});
