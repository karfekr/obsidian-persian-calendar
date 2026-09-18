import { formatPattern } from "src/utils/dateEngine";
import { describe, expect, it } from "vitest";

describe("Gregorian quarter tokens", () => {
	it.each([
		[1, "1", "01", "Spr", "Spring"],
		[2, "2", "02", "Sum", "Summer"],
		[3, "3", "03", "Aut", "Autumn"],
		[4, "4", "04", "Win", "Winter"],
	])("formats quarter %s", (quarter, q, qq, qqq, qqqq) => {
		const context = { quarter };
		expect(formatPattern("Q", context)).toBe(q);
		expect(formatPattern("QQ", context)).toBe(qq);
		expect(formatPattern("QQQ", context)).toBe(qqq);
		expect(formatPattern("QQQQ", context)).toBe(qqqq);
	});
});
