import { tokenize } from "src/utils/dateEngine/tokenizer";
import { defaultTokenRegistry } from "src/utils/dateEngine/tokens";
import type { TPatternSegment } from "src/utils/dateEngine/types";

function segmentSummary(segments: TPatternSegment[]) {
	return segments.map((s) =>
		s.type === "literal" ? { literal: s.value } : { token: s.token.token },
	);
}

describe("tokenizer - longest-token-first matching", () => {
	it("never splits MMMM into MM + MM", () => {
		const segments = tokenize("MMMM", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "MMMM" }]);
	});

	it("never splits jMMMM into jMM + MM or jM + MMM", () => {
		const segments = tokenize("jMMMM", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "jMMMM" }]);
	});

	it("picks jYYYY over YYYY when the 'j' prefix is present", () => {
		const segments = tokenize("jYYYY", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "jYYYY" }]);
	});

	it("still matches YYYY (not jYYYY) when there is no leading j", () => {
		const segments = tokenize("YYYY", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "YYYY" }]);
	});

	it("resolves MMM vs MMMM correctly depending on how many M's are present", () => {
		expect(segmentSummary(tokenize("MMM", defaultTokenRegistry))).toEqual([{ token: "MMM" }]);
		expect(segmentSummary(tokenize("MMMM", defaultTokenRegistry))).toEqual([{ token: "MMMM" }]);
	});

	it("tokenizes adjacent fixed-width tokens deterministically without a separator", () => {
		const segments = tokenize("YYYYMMDD", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "YYYY" }, { token: "MM" }, { token: "DD" }]);
	});
});

describe("tokenizer - escaped literals via [brackets]", () => {
	it("treats bracketed text as a literal, not as tokens", () => {
		const segments = tokenize("jYYYY-[Week]-WW", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([
			{ token: "jYYYY" },
			{ literal: "-" },
			{ literal: "Week" },
			{ literal: "-" },
			{ token: "WW" },
		]);
	});

	it("does not scan token-shaped text inside brackets for tokens", () => {
		const segments = tokenize("[jYYYY]-jYYYY", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([
			{ literal: "jYYYY" },
			{ literal: "-" },
			{ token: "jYYYY" },
		]);
	});

	it("supports multiple separate bracket groups in one pattern", () => {
		const segments = tokenize("[Q]jQ[of]jYYYY", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([
			{ literal: "Q" },
			{ token: "jQ" },
			{ literal: "of" },
			{ token: "jYYYY" },
		]);
	});

	it("treats an unterminated bracket as a literal '[' rather than throwing", () => {
		expect(() => tokenize("jYYYY-[oops", defaultTokenRegistry)).not.toThrow();

		const segments = tokenize("jYYYY-[oops", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "jYYYY" }, { literal: "-[oops" }]);
	});

	it("supports an empty bracket pair as an empty literal", () => {
		const segments = tokenize("jYYYY[]jMM", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "jYYYY" }, { token: "jMM" }]);
	});
});

describe("tokenizer - unknown text", () => {
	it("accumulates unrecognized letters as literal text instead of throwing", () => {
		const segments = tokenize("jYYYY-ZZZZ", defaultTokenRegistry);
		expect(segmentSummary(segments)).toEqual([{ token: "jYYYY" }, { literal: "-ZZZZ" }]);
	});

	it("returns an empty segment list for an empty pattern", () => {
		expect(tokenize("", defaultTokenRegistry)).toEqual([]);
	});
});
