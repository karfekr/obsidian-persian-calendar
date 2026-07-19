import {
	clearCompiledPatternCache,
	compilePattern,
	getCompiledPatternCacheSize,
} from "src/utils/dateEngine/compiler";
import { DatePatternFormatError } from "src/utils/dateEngine/errors";
import { formatPattern } from "src/utils/dateEngine/formatter";
import { parsePattern } from "src/utils/dateEngine/parser";
import { defaultTokenRegistry } from "src/utils/dateEngine/tokens";
import { tokenize } from "src/utils/dateEngine/tokenizer";
import { validatePattern } from "src/utils/dateEngine/validator";

beforeEach(() => {
	clearCompiledPatternCache();
});

describe("edge cases - lossy 2-digit year (YY/jYY)", () => {
	it("format is lossy: only the last two digits survive", () => {
		expect(formatPattern("YY", { gy: 2026 })).toBe("26");
		expect(formatPattern("YY", { gy: 1926 })).toBe("26");
	});

	it("parse returns the raw two-digit number, not a reconstructed full year", () => {
		expect(parsePattern("YY", "26")).toEqual({ gy: 26 });
	});
});

describe("edge cases - ambiguous adjacent unpadded tokens", () => {
	it("validator flags this shape as ambiguous", () => {
		expect(
			validatePattern("jMjD").errors.some((e) => e.type === "ambiguous-adjacent-numeric"),
		).toBe(true);
	});

	it("parsing an ambiguous pattern still returns a deterministic (not necessarily 'intended') result", () => {
		expect(parsePattern("jMjD", "39")).toEqual({ jm: 3, jd: 9 });
		expect(parsePattern("jMjD", "312")).toEqual({ jm: 31, jd: 2 });
	});

	it("adding a literal separator removes the ambiguity entirely", () => {
		expect(
			validatePattern("jM-jD").errors.some((e) => e.type === "ambiguous-adjacent-numeric"),
		).toBe(false);
		expect(parsePattern("jM-jD", "3-9")).toEqual({ jm: 3, jd: 9 });
		expect(parsePattern("jM-jD", "31-2")).toEqual({ jm: 31, jd: 2 });
	});
});

describe("edge cases - regex-special characters in literals", () => {
	it("literal text containing regex metacharacters is matched literally, not as regex", () => {
		expect(formatPattern("jYYYY (jMM)", { jy: 1403, jm: 1 })).toBe("1403 (01)");
		expect(parsePattern("jYYYY (jMM)", "1403 (01)")).toEqual({ jy: 1403, jm: 1 });
		// A literal paren should not be interpreted as a regex group boundary.
		expect(parsePattern("jYYYY (jMM)", "1403 01")).toBeNull();
	});

	it("bracket-escaped literals containing regex metacharacters are also matched literally", () => {
		expect(formatPattern("jYYYY[.]jMM", { jy: 1403, jm: 1 })).toBe("1403.01");
		expect(parsePattern("jYYYY[.]jMM", "1403.01")).toEqual({ jy: 1403, jm: 1 });
		expect(parsePattern("jYYYY[.]jMM", "1403x01")).toBeNull();
	});
});

describe("edge cases - compiled pattern caching", () => {
	it("returns the same compiled object for repeated calls with the same pattern+locale", () => {
		const a = compilePattern("jYYYY-jMM-jDD", "fa");
		const b = compilePattern("jYYYY-jMM-jDD", "fa");
		expect(a).toBe(b);
	});

	it("compiles separately per locale, since name tokens differ", () => {
		const en = compilePattern("jMMMM", "en");
		const fa = compilePattern("jMMMM", "fa");
		expect(en).not.toBe(fa);
		expect(en.regex.source).not.toBe(fa.regex.source);
	});

	it("cache can be cleared", () => {
		compilePattern("jYYYY", "en");
		expect(getCompiledPatternCacheSize()).toBeGreaterThan(0);

		clearCompiledPatternCache();
		expect(getCompiledPatternCacheSize()).toBe(0);
	});
});

describe("edge cases - out-of-range values", () => {
	it("formatting does not validate calendar correctness (e.g. month 13) - that's the caller's job", () => {
		expect(formatPattern("jMM", { jm: 13 })).toBe("13");
	});

	it("parsing does not reject out-of-range numeric values either", () => {
		expect(parsePattern("jMM", "13")).toEqual({ jm: 13 });
	});
});

describe("edge cases - single-letter tokens colliding with plain English words", () => {
	it("an unescaped word starting with a token letter is misparsed as that token", () => {
		const segments = tokenize("Daily", defaultTokenRegistry);
		expect(segmentSummaryFor(segments)).toEqual([{ token: "D" }, { literal: "aily" }]);
	});

	it("this then makes formatting fail, because the pattern now silently requires a 'gd' value", () => {
		expect(() => formatPattern("Journal/jYYYY/Daily", { jy: 1403 })).toThrow(
			DatePatternFormatError,
		);
	});

	it("wrapping the literal word in [brackets] fixes it, exactly as it does in moment.js-style formatters", () => {
		expect(formatPattern("Journal/jYYYY/[Daily]", { jy: 1403 })).toBe("Journal/1403/Daily");
	});

	it("also affects 'Monthly' (M) and 'Weekly' (W), but not 'Seasonal' (no colliding leading letter)", () => {
		expect(() => formatPattern("Monthly", { jy: 1403 })).toThrow(DatePatternFormatError);
		expect(() => formatPattern("Weekly", { jy: 1403 })).toThrow(DatePatternFormatError);
		expect(formatPattern("Seasonal", {})).toBe("Seasonal");
	});
});

function segmentSummaryFor(segments: ReturnType<typeof tokenize>) {
	return segments.map((s) =>
		s.type === "literal" ? { literal: s.value } : { token: s.token.token },
	);
}

describe("edge cases - week and season fields are shared across calendars", () => {
	it("gregorian W and jalali jW both write to the same 'week' field", () => {
		expect(formatPattern("W", { week: 5 })).toBe("5");
		expect(formatPattern("jW", { week: 5 })).toBe("5");
	});

	it("a pattern combining W and jW is flagged as a duplicate-field warning", () => {
		const result = validatePattern("W-jW");
		expect(result.errors.some((e) => e.type === "duplicate-field")).toBe(true);
	});
});
