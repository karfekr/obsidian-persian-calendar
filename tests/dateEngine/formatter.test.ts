import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { DatePatternFormatError } from "src/utils/dateEngine/errors";
import { formatPattern } from "src/utils/dateEngine/formatter";

beforeEach(() => {
	clearCompiledPatternCache();
});

describe("formatPattern - numeric tokens", () => {
	it("zero-pads YYYY/MM/DD", () => {
		expect(formatPattern("YYYY-MM-DD", { gy: 2026, gm: 3, gd: 9 })).toBe("2026-03-09");
	});

	it("zero-pads jYYYY/jMM/jDD", () => {
		expect(formatPattern("jYYYY-jMM-jDD", { jy: 1403, jm: 1, jd: 5 })).toBe("1403-01-05");
	});

	it("does not pad unpadded M/D/Q tokens", () => {
		expect(formatPattern("jM-jD", { jm: 3, jd: 9 })).toBe("3-9");
		expect(formatPattern("jQ", { season: 2 })).toBe("2");
	});

	it("renders YY as the last two digits of the year", () => {
		expect(formatPattern("YY", { gy: 2026 })).toBe("26");
		expect(formatPattern("jYY", { jy: 1403 })).toBe("03");
	});

	it("truncates fractional values before formatting", () => {
		expect(formatPattern("MM", { gm: 3.9 })).toBe("03");
	});
});

describe("formatPattern - name tokens", () => {
	it("renders full Gregorian month names in English", () => {
		expect(formatPattern("MMMM", { gm: 1 })).toBe("January");
		expect(formatPattern("MMMM", { gm: 12 })).toBe("December");
	});

	it("renders full Jalali month names in Persian", () => {
		expect(formatPattern("jMMMM", { jm: 1 })).toBe("Farvardin");
	});

	it("renders abbreviated English month names", () => {
		expect(formatPattern("MMM", { gm: 1 })).toBe("Jan");
		expect(formatPattern("MMM", { gm: 9 })).toBe("Sep");
	});

	it("renders season names by locale", () => {
		expect(formatPattern("jQQQQ", { season: 1 })).toBe("Spring");
	});

	it("defaults to English locale when none is given", () => {
		expect(formatPattern("MMMM", { gm: 6 })).toBe("June");
	});
});

describe("formatPattern - literals and mixed patterns", () => {
	it("preserves literal text and separators verbatim", () => {
		expect(formatPattern("Journal/jYYYY/[Daily]", { jy: 1403 })).toBe("Journal/1403/Daily");
	});

	it("returns an empty string for an empty pattern", () => {
		expect(formatPattern("", {})).toBe("");
	});

	it("returns pure literal text unchanged when the pattern has no tokens", () => {
		expect(formatPattern("no-tokens-here", { jy: 1403 })).toBe("no-tokens-here");
	});
});

describe("formatPattern - missing context", () => {
	it("throws DatePatternFormatError when a required field is absent", () => {
		expect(() => formatPattern("jYYYY-jMM-jDD", { jy: 1403, jm: 1 })).toThrow(
			DatePatternFormatError,
		);
	});

	it("error carries the offending pattern and token for UI/debugging", () => {
		try {
			formatPattern("jYYYY-jDD", { jy: 1403 });
			expect.unreachable("formatPattern should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(DatePatternFormatError);
			expect((error as DatePatternFormatError).pattern).toBe("jYYYY-jDD");
			expect((error as DatePatternFormatError).token).toBe("jDD");
		}
	});

	it("does not throw for fields the pattern never references", () => {
		expect(() => formatPattern("jYYYY", { jy: 1403, jm: 99, jd: 99 })).not.toThrow();
	});
});
