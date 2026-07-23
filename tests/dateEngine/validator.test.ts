import { validatePattern } from "src/utils/dateEngine/validator";

describe("validatePattern - fatal errors", () => {
	it("flags an empty pattern as invalid", () => {
		const result = validatePattern("");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.type === "empty-pattern")).toBe(true);
	});

	it("flags a whitespace-only pattern as invalid", () => {
		const result = validatePattern("   ");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.type === "empty-pattern")).toBe(true);
	});

	it("flags unknown tokens (typos) as invalid and names the offending text", () => {
		const result = validatePattern("jYYYY-XXXX");
		expect(result.valid).toBe(false);

		const unknown = result.errors.find((e) => e.type === "unknown-token");
		expect(unknown).toBeDefined();
		expect(unknown?.token).toBe("XXXX");
	});

	it("reports every distinct unknown run, not just the first", () => {
		const result = validatePattern("FOO-jYYYY-BAR");
		const unknownTokens = result.errors
			.filter((e) => e.type === "unknown-token")
			.map((e) => e.token);

		expect(unknownTokens).toEqual(["FOO", "BAR"]);
	});

	it("flags a pattern made entirely of plain letters as invalid (looks like an attempted token)", () => {
		const result = validatePattern("static-name");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.type === "unknown-token")).toBe(true);
	});
});

describe("validatePattern - valid patterns", () => {
	it("accepts a known, unambiguous pattern with no errors", () => {
		const result = validatePattern("jYYYY-jMM-jDD");
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});
});

describe("validatePattern - non-fatal warnings", () => {
	it("warns (but does not invalidate) adjacent numeric tokens with no separator", () => {
		const result = validatePattern("jYYYYjMM");
		expect(result.valid).toBe(true);
		expect(result.errors.some((e) => e.type === "ambiguous-adjacent-numeric")).toBe(true);
	});

	it("does not warn when a literal separator sits between numeric tokens", () => {
		const result = validatePattern("jYYYY-jMM");
		expect(result.errors.some((e) => e.type === "ambiguous-adjacent-numeric")).toBe(false);
	});

	it("does not warn about adjacency between a numeric token and a name token", () => {
		const result = validatePattern("jMMMMjYYYY");
		expect(result.errors.some((e) => e.type === "ambiguous-adjacent-numeric")).toBe(false);
	});

	it("warns when two tokens target the same context field", () => {
		const result = validatePattern("jYYYY-jYY");
		expect(result.valid).toBe(true);
		const dup = result.errors.find((e) => e.type === "duplicate-field");
		expect(dup).toBeDefined();
	});

	it("does not warn about duplicate fields for tokens targeting different fields", () => {
		const result = validatePattern("jYYYY-jMM-jDD");
		expect(result.errors.some((e) => e.type === "duplicate-field")).toBe(false);
	});
});
