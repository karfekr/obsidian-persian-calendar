import type { EditorSuggestContext } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import SmartDateLinker from "src/services/SmartDateLinker";
import {
	getNaturalDateSuggestions,
	normalizePersianQuery,
	parseNaturalPersianDate,
	parsePersianNumber,
} from "src/services/SmartDateLinker/naturalDateParser";
import type { TSetting } from "src/types";
import { jalaliToCalendarDate } from "src/utils/dateUtils";

function createTestPlugin(overrides: Partial<TSetting> = {}): PersianCalendarPlugin {
	return {
		setting: {
			...DEFAULT_SETTING,
			...overrides,
		},
	} as unknown as PersianCalendarPlugin;
}

describe("Natural-Language Persian Date Parser in SmartDateLinker", () => {
	// Anchor date: 1405-08-25 (Monday, Gregorian 2026-11-16)
	const anchorDate = jalaliToCalendarDate(1405, 8, 25);

	describe("normalizePersianQuery & parsePersianNumber", () => {
		it("normalizes Persian/Arabic digits, Arabic letters, and ZWNJ/whitespace", () => {
			expect(normalizePersianQuery("  سه‌شنبه   آینده ")).toBe("سه شنبه آینده");
			expect(normalizePersianQuery("۱۵ بهمن ۱۴۰۶")).toBe("15 بهمن 1406");
			expect(normalizePersianQuery("١٠ روز قبل")).toBe("10 روز قبل");
			expect(normalizePersianQuery("پنج‌شنبه")).toBe("پنج شنبه");
		});

		it("parses digits, numeric ordinals, cardinal words, and ordinal words", () => {
			expect(parsePersianNumber("۱۵")).toBe(15);
			expect(parsePersianNumber("۱۵ام")).toBe(15);
			expect(parsePersianNumber("اول")).toBe(1);
			expect(parsePersianNumber("یکم")).toBe(1);
			expect(parsePersianNumber("پانزدهم")).toBe(15);
			expect(parsePersianNumber("بیست و یکم")).toBe(21);
			expect(parsePersianNumber("سی‌ام")).toBe(30);
			expect(parsePersianNumber("سی و یکم")).toBe(31);
			expect(parsePersianNumber("ده")).toBe(10);
			expect(parsePersianNumber("بیست و پنج")).toBe(25);
			expect(parsePersianNumber("نامعتبر")).toBeNull();
		});
	});

	describe("Explicit month + day (+ optional year) expressions", () => {
		it("resolves @۱۵ بهمن to the current Jalali year (1405-11-15)", () => {
			const plugin = createTestPlugin({
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				dailyNotesPath: "Journal/jYYYY/[Daily]",
			});
			const linker = new SmartDateLinker(plugin);

			expect(linker.formatSmartDate("۱۵ بهمن", anchorDate, "fa", true)).toBe(
				"[[Journal/1405/Daily/1405-11-15|۱۵ بهمن]]",
			);
			expect(linker.formatSmartDate("۱۵ بهمن", anchorDate, "fa", false)).toBe("1405-11-15");
		});

		it("resolves @اول فروردین ۱۴۰۶ and @یکم فروردین ۱۴۰۶ to 1406-01-01", () => {
			const plugin = createTestPlugin({
				dateFormat: "gregorian",
				dailyNoteFormat: "YYYY-MM-DD",
				dailyNotesPath: "Journal/jYYYY/[Daily]",
			});
			const linker = new SmartDateLinker(plugin);

			// 1406-01-01 is 2027-03-21
			expect(linker.formatSmartDate("اول فروردین ۱۴۰۶", anchorDate, "fa", true)).toBe(
				"[[Journal/1406/Daily/2027-03-21|اول فروردین ۱۴۰۶]]",
			);
			expect(linker.formatSmartDate("اول فروردین ۱۴۰۶", anchorDate, "fa", false)).toBe(
				"2027-03-21",
			);
			expect(linker.formatSmartDate("یکم فروردین ۱۴۰۶", anchorDate, "fa", false)).toBe(
				"2027-03-21",
			);
		});

		it("resolves compound ordinal days and 2-digit years", () => {
			const plugin = createTestPlugin({ dateFormat: "jalali" });
			const linker = new SmartDateLinker(plugin);

			expect(linker.formatSmartDate("سی و یکم اردیبهشت", anchorDate, "fa", false)).toBe(
				"1405-02-31",
			);
			expect(linker.formatSmartDate("پانزدهم بهمن ۰۶", anchorDate, "fa", false)).toBe("1406-11-15");
			expect(linker.formatSmartDate("اول فروردین سال آینده", anchorDate, "fa", false)).toBe(
				"1406-01-01",
			);
		});

		it("handles آخر <month> with leap-year awareness and rejects invalid dates", () => {
			const plugin = createTestPlugin({ dateFormat: "jalali" });
			const linker = new SmartDateLinker(plugin);

			// 1403 is a leap year (Esfand has 30 days); 1404 and 1405 are non-leap years (29 days)
			expect(linker.formatSmartDate("آخر اسفند ۱۴۰۳", anchorDate, "fa", false)).toBe("1403-12-30");
			expect(linker.formatSmartDate("آخر اسفند ۱۴۰۴", anchorDate, "fa", false)).toBe("1404-12-29");
			expect(linker.formatSmartDate("سی‌ام اسفند ۱۴۰۳", anchorDate, "fa", false)).toBe("1403-12-30");
			expect(linker.formatSmartDate("۳۰ اسفند ۱۴۰۴", anchorDate, "fa", false)).toBe(
				"تاریخ شناسایی نشد",
			);
			expect(linker.formatSmartDate("۳۱ مهر", anchorDate, "fa", false)).toBe("تاریخ شناسایی نشد");
		});

		it("resolves numeric slash and dash Jalali dates", () => {
			const plugin = createTestPlugin({ dateFormat: "jalali" });
			const linker = new SmartDateLinker(plugin);

			expect(linker.formatSmartDate("۱۴۰۶/۰۱/۰۱", anchorDate, "fa", false)).toBe("1406-01-01");
			expect(linker.formatSmartDate("1406-11-15", anchorDate, "fa", false)).toBe("1406-11-15");
		});
	});

	describe("Relative offsets (N روز/هفته/ماه/سال قبل/بعد/آینده/گذشته)", () => {
		it("resolves @۱۰ روز قبل and other day offsets", () => {
			const plugin = createTestPlugin({
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				dailyNotesPath: "Journal/jYYYY/[Daily]",
			});
			const linker = new SmartDateLinker(plugin);

			// 1405-08-25 minus 10 days = 1405-08-15
			expect(linker.formatSmartDate("۱۰ روز قبل", anchorDate, "fa", true)).toBe(
				"[[Journal/1405/Daily/1405-08-15|۱۰ روز قبل]]",
			);
			expect(linker.formatSmartDate("۱۰ روز قبل", anchorDate, "fa", false)).toBe("1405-08-15");
			expect(linker.formatSmartDate("ده روز پیش", anchorDate, "fa", false)).toBe("1405-08-15");
			expect(linker.formatSmartDate("۵ روز آینده", anchorDate, "fa", false)).toBe("1405-08-30");
			expect(linker.formatSmartDate("سه روز دیگر", anchorDate, "fa", false)).toBe("1405-08-28");
		});

		it("resolves relative week, month, and year offsets to daily notes", () => {
			const plugin = createTestPlugin({ dateFormat: "jalali" });
			const linker = new SmartDateLinker(plugin);

			// 1405-08-25 + 2 weeks (14 days) = 1405-09-09
			expect(linker.formatSmartDate("۲ هفته آینده", anchorDate, "fa", false)).toBe("1405-09-09");
			expect(linker.formatSmartDate("دو هفته قبل", anchorDate, "fa", false)).toBe("1405-08-11");
			// 1405-08-25 + 2 Jalali months = 1405-10-25
			expect(linker.formatSmartDate("۲ ماه بعد", anchorDate, "fa", false)).toBe("1405-10-25");
			// 1405-08-25 - 1 Jalali year = 1404-08-25
			expect(linker.formatSmartDate("یک سال قبل", anchorDate, "fa", false)).toBe("1404-08-25");
		});
	});

	describe("Weekday expressions with ZWNJ normalization and آینده/گذشته modifiers", () => {
		it("resolves @سه شنبه آینده identically to @سه‌شنبه بعد", () => {
			const plugin = createTestPlugin({
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				dailyNotesPath: "Journal/jYYYY/[Daily]",
			});
			const linker = new SmartDateLinker(plugin);

			// anchorDate is Monday 1405-08-25.
			// Upcoming Tuesday is 1405-08-26 (+1 day).
			// "سه‌شنبه بعد" / "سه شنبه آینده" is +1 + 7 = +8 days -> 1405-09-03.
			expect(linker.formatSmartDate("سه‌شنبه", anchorDate, "fa", false)).toBe("1405-08-26");
			expect(linker.formatSmartDate("سه شنبه", anchorDate, "fa", false)).toBe("1405-08-26");
			expect(linker.formatSmartDate("سه‌شنبه بعد", anchorDate, "fa", false)).toBe("1405-09-03");
			expect(linker.formatSmartDate("سه شنبه آینده", anchorDate, "fa", false)).toBe("1405-09-03");
			expect(linker.formatSmartDate("سه شنبه آینده", anchorDate, "fa", true)).toBe(
				"[[Journal/1405/Daily/1405-09-03|سه شنبه آینده]]",
			);

			// "سه‌شنبه قبل" / "سه شنبه گذشته" is +1 - 7 = -6 days -> 1405-08-19.
			expect(linker.formatSmartDate("سه‌شنبه قبل", anchorDate, "fa", false)).toBe("1405-08-19");
			expect(linker.formatSmartDate("سه شنبه گذشته", anchorDate, "fa", false)).toBe("1405-08-19");
			expect(linker.formatSmartDate("پنج شنبه پیش", anchorDate, "fa", false)).toBe("1405-08-21");
		});
	});

	describe("EditorSuggest provider (trigger, getSuggestions, onSelect)", () => {
		it("matches multi-word natural queries after @ and @/ without matching email addresses", () => {
			const plugin = createTestPlugin();
			const provider = new SmartDateLinker(plugin).toProvider();

			expect("یادداشت @۱۵ بهمن".match(provider.trigger)?.[0]).toBe("@۱۵ بهمن");
			expect("@اول فروردین ۱۴۰۶".match(provider.trigger)?.[0]).toBe("@اول فروردین ۱۴۰۶");
			expect("متن @/سه شنبه آینده".match(provider.trigger)?.[0]).toBe("@/سه شنبه آینده");
			expect("@۱۰ روز قبل".match(provider.trigger)?.[0]).toBe("@۱۰ روز قبل");
			expect("user@example.com".match(provider.trigger)).toBeNull();
		});

		it("returns dynamic suggestions for complete and partial natural-language queries", () => {
			const plugin = createTestPlugin({ dateFormat: "jalali" });
			const linker = new SmartDateLinker(plugin);
			const provider = linker.toProvider();

			expect(provider.getSuggestions("۱۵ بهمن")).toContain("۱۵ بهمن");
			expect(provider.getSuggestions("/اول فروردین ۱۴۰۶")).toContain("اول فروردین ۱۴۰۶");
			expect(provider.getSuggestions("۱۰ روز قبل")).toContain("۱۰ روز قبل");
			expect(provider.getSuggestions("سه شنبه آینده")).toContain("سه شنبه آینده");

			// Partial month completion
			const partialMonth = getNaturalDateSuggestions("۱۵ به", anchorDate);
			expect(partialMonth).toContain("۱۵ بهمن");

			// Partial relative completion
			const partialRelative = getNaturalDateSuggestions("۱۰ روز", anchorDate);
			expect(partialRelative).toContain("۱۰ روز قبل");
			expect(partialRelative).toContain("۱۰ روز بعد");
		});

		it("resolves link vs plain text via onSelect based on @ vs @/", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));

			const plugin = createTestPlugin({
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				dailyNotesPath: "Journal/jYYYY/[Daily]",
			});
			const provider = new SmartDateLinker(plugin).toProvider();

			const linkResult = provider.onSelect("اول فروردین ۱۴۰۶", {
				query: "اول فروردین ۱۴۰۶",
			} as EditorSuggestContext);
			expect(linkResult).toBe("[[Journal/1406/Daily/1406-01-01|اول فروردین ۱۴۰۶]]");

			const plainResult = provider.onSelect("اول فروردین ۱۴۰۶", {
				query: "/اول فروردین ۱۴۰۶",
			} as EditorSuggestContext);
			expect(plainResult).toBe("1406-01-01");

			vi.useRealTimers();
		});

		it("returns null from parseNaturalPersianDate for non-date text", () => {
			expect(parseNaturalPersianDate("سلام دنیا", anchorDate)).toBeNull();
			expect(parseNaturalPersianDate("", anchorDate)).toBeNull();
		});
	});
});
