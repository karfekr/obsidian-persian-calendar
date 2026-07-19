import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { parsePattern } from "src/utils/dateEngine/parser";

beforeEach(() => {
	clearCompiledPatternCache();
});

describe("parsePattern - round trips with formatPattern", () => {
	it("parses a strict daily jalali filename back into a context", () => {
		expect(parsePattern("jYYYY-jMM-jDD", "1403-01-05")).toEqual({ jy: 1403, jm: 1, jd: 5 });
	});

	it("parses a gregorian filename back into a context", () => {
		expect(parsePattern("YYYY-MM-DD", "2026-03-09")).toEqual({ gy: 2026, gm: 3, gd: 9 });
	});

	it("parses a folder path fragment with a single token amongst literals", () => {
		expect(parsePattern("Journal/jYYYY/[Daily]", "Journal/1403/Daily")).toEqual({ jy: 1403 });
	});

	it("parses bracket-escaped literal patterns", () => {
		expect(parsePattern("jYYYY-[Week]-WW", "1403-Week-07")).toEqual({ jy: 1403, week: 7 });
	});

	it("parses full month names back to a month index", () => {
		expect(parsePattern("MMMM YYYY", "January 2026", "en")).toEqual({ gm: 1, gy: 2026 });
		expect(parsePattern("jMMMM jYYYY", "فروردین 1403", "fa")).toEqual({ jm: 1, jy: 1403 });
	});

	it("parses abbreviated English month names back to a month index", () => {
		expect(parsePattern("MMM YYYY", "Sep 2026", "en")).toEqual({ gm: 9, gy: 2026 });
	});
});

describe("parsePattern - non-matching input", () => {
	it("returns null when the input doesn't match the pattern's shape at all", () => {
		expect(parsePattern("jYYYY-jMM-jDD", "not-a-date")).toBeNull();
	});

	it("returns null when the input is missing required zero-padding", () => {
		expect(parsePattern("jYYYY-jMM-jDD", "1403-1-5")).toBeNull();
	});

	it("returns null for a month name that doesn't exist in the given locale", () => {
		expect(parsePattern("MMMM YYYY", "Farvardin 2026", "en")).toBeNull();
	});

	it("returns null for trailing or leading extra characters (pattern is fully anchored)", () => {
		expect(parsePattern("jYYYY", "1403x")).toBeNull();
		expect(parsePattern("jYYYY", "x1403")).toBeNull();
	});

	it("returns null for an empty string against a non-empty pattern", () => {
		expect(parsePattern("jYYYY", "")).toBeNull();
	});
});

describe("parsePattern - partial contexts", () => {
	it("only populates fields the pattern actually references", () => {
		const result = parsePattern("jYYYY", "1403");
		expect(result).toEqual({ jy: 1403 });
		expect(result).not.toHaveProperty("jm");
		expect(result).not.toHaveProperty("jd");
	});

	it("an empty pattern matches only an empty string and returns an empty context", () => {
		expect(parsePattern("", "")).toEqual({});
		expect(parsePattern("", "anything")).toBeNull();
	});
});
