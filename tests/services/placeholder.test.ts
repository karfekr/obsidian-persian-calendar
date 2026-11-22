import type { App } from "obsidian";
import { TFile } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NoteService from "src/services/NoteService";
import Placeholder from "src/services/Placeholder";
import type { TSetting } from "src/types";
import { dashToCalendarDate, dateToDash } from "src/utils/dashUtils";
import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { todayTehran } from "src/utils/dateUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

beforeEach(() => {
	clearCompiledPatternCache();
});

function createMockPlugin(
	settingOverrides: Partial<TSetting> = {},
	initialFiles: Record<string, string> = {},
) {
	const fileStore = new Map<string, string>(Object.entries(initialFiles));

	const mockApp = {
		vault: {
			getAbstractFileByPath: (path: string) => {
				if (fileStore.has(path)) {
					const file = new TFile();
					file.path = path;
					file.basename =
						path
							.replace(/\.[^/.]+$/, "")
							.split("/")
							.pop() ?? "";
					return file;
				}
				return null;
			},
			read: async (file: TFile) => fileStore.get(file.path) ?? "",
			modify: async (file: TFile, content: string) => {
				fileStore.set(file.path, content);
			},
		},
		workspace: {
			getActiveFile: () => null,
		},
	};

	const plugin = {
		app: mockApp,
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
	} as unknown as PersianCalendarPlugin;

	const placeholder = new Placeholder(plugin);
	plugin.placeholder = placeholder;
	plugin.noteService = new NoteService(mockApp as unknown as App, plugin);

	return { plugin, placeholder, fileStore };
}

describe("Issue #97: Unresolved daily note placeholders for dates other than today", () => {
	it("resolves {{تاریخ شمسی یادداشت}} and {{روز هفته یادداشت}} for a date other than today", () => {
		// Target date: 1403-08-15 (Tuesday, Gregorian 2024-11-05)
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD",
			dailyNotesPath: "Journal/[jYYYY]/Daily",
		});

		const noteFile = {
			path: "Journal/1403/Daily/1403-08-15.md",
			basename: "1403-08-15",
		} as TFile;

		const template = [
			"Today: {{تاریخ شمسی جاری}}",
			"Note Jalali: {{تاریخ شمسی یادداشت}}",
			"Note Weekday: {{روز هفته یادداشت}}",
			"Note Gregorian: {{تاریخ میلادی یادداشت}}",
		].join("\n");

		const result = placeholder.processPlaceholders(noteFile, template);

		// Current date must resolve to today's date
		const expectedTodayJalali = dateToDash(todayTehran(), "jalali");
		expect(result).toContain(`Today: ${expectedTodayJalali}`);

		// Note date placeholders must resolve to 1403-08-15
		expect(result).toContain("Note Jalali: 1403-08-15");
		expect(result).toContain("Note Weekday: سه‌شنبه");
		expect(result).toContain("Note Gregorian: 2024-11-05");

		// No raw placeholders should remain
		expect(result).not.toContain("{{تاریخ شمسی یادداشت}}");
		expect(result).not.toContain("{{روز هفته یادداشت}}");
		expect(result).not.toContain("{{تاریخ میلادی یادداشت}}");
	});

	it("keeps current-date and note-date placeholders independent when note date is in the past", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD",
		});

		const pastNoteFile = {
			path: "1401-01-01.md",
			basename: "1401-01-01",
		} as TFile;

		const template = "{{تاریخ شمسی جاری}} | {{تاریخ شمسی یادداشت}} | {{روز هفته یادداشت}}";
		const result = placeholder.processPlaceholders(pastNoteFile, template);

		const todayJalali = dateToDash(todayTehran(), "jalali");
		expect(result).toBe(`${todayJalali} | 1401-01-01 | دوشنبه`);
	});

	it("keeps current-date and note-date placeholders independent when note date is in the future", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD",
		});

		const futureNoteFile = {
			path: "1408-12-29.md",
			basename: "1408-12-29",
		} as TFile;

		const template = "{{تاریخ شمسی جاری}} | {{تاریخ شمسی یادداشت}}";
		const result = placeholder.processPlaceholders(futureNoteFile, template);

		const todayJalali = dateToDash(todayTehran(), "jalali");
		expect(result).toBe(`${todayJalali} | 1408-12-29`);
	});

	it("applies placeholders correctly via getTemplateContent", async () => {
		const templatePath = "Templates/DailyTemplate.md";
		const templateContent = [
			"# Note: {{تاریخ شمسی یادداشت}}",
			"Day: {{روز هفته یادداشت}}",
			"Created: {{تاریخ شمسی جاری}}",
		].join("\n");

		const { placeholder } = createMockPlugin(
			{
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				dailyTemplatePath: templatePath,
			},
			{
				[templatePath]: templateContent,
			},
		);

		const targetFile = {
			path: "1403-05-10.md",
			basename: "1403-05-10",
		} as TFile;

		const resolved = await placeholder.getTemplateContent(templatePath, targetFile);
		expect(resolved).not.toBeNull();
		expect(resolved).toContain("# Note: 1403-05-10");
		expect(resolved).toContain("Day: چهارشنبه");
		expect(resolved).toContain(`Created: ${dateToDash(todayTehran(), "jalali")}`);
	});
});

describe("Issue #99: Gregorian filename (YYYY-MM-DD) with Jalali semantic calendar", () => {
	it("correctly interprets 2024-11-02 when dateFormat is jalali", () => {
		// 2024-11-02 corresponds to 1403-08-12 (Saturday)
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "YYYY-MM-DD",
			dailyNotesPath: "03 - Diary/[jYYYY]/[jMM] - [jMMMM]/[jYYYY]-W[ww]",
		});

		const noteFile = {
			path: "03 - Diary/1403/08 - Aban/1403-W33/2024-11-02.md",
			basename: "2024-11-02",
		} as TFile;

		const template = [
			"Jalali: {{تاریخ شمسی یادداشت}}",
			"Gregorian: {{تاریخ میلادی یادداشت}}",
			"Year: {{سال یادداشت}}",
			"Month Name: {{نام ماه یادداشت}}",
			"Weekday: {{روز هفته یادداشت}}",
		].join("\n");

		const result = placeholder.processPlaceholders(noteFile, template);

		expect(result).toContain("Jalali: 1403-08-12");
		expect(result).toContain("Gregorian: 2024-11-02");
		expect(result).toContain("Year: 1403");
		expect(result).toContain("Month Name: آبان");
		expect(result).toContain("Weekday: شنبه");

		// Must NOT contain wrong year 2024 or wrong month Bahman
		expect(result).not.toContain("Jalali: 2024-11-02");
		expect(result).not.toContain("Gregorian: 2646-01-16");
		expect(result).not.toContain("Year: 2024");
		expect(result).not.toContain("Month Name: بهمن");
	});

	it("resolves root-level Gregorian daily note with Jalali semantic calendar", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "YYYY-MM-DD",
		});

		const noteFile = {
			path: "2024-10-27.md",
			basename: "2024-10-27",
		} as TFile;

		// 2024-10-27 is 1403-08-06 (Sunday)
		const template =
			"{{تاریخ شمسی یادداشت}} | {{تاریخ میلادی یادداشت}} | {{روز هفته یادداشت}} | {{سال یادداشت}}";
		const result = placeholder.processPlaceholders(noteFile, template);

		expect(result).toBe("1403-08-06 | 2024-10-27 | یکشنبه | 1403");
	});

	it("resolves week boundary placeholders relative to note date formatted in Jalali", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "YYYY-MM-DD",
		});

		const noteFile = {
			path: "2024-11-02.md",
			basename: "2024-11-02",
		} as TFile;

		const template = "Start: {{اول هفته}}";
		const result = placeholder.processPlaceholders(noteFile, template);

		// 2024-11-02 is Saturday 1403-08-12 (start of week in Iran is Saturday)
		expect(result).toBe("Start: 1403-08-12");
	});
});

describe("Matrix verification: all combinations of filename format and semantic calendar", () => {
	const testCases = [
		{
			desc: "Gregorian filename (YYYY-MM-DD) + Jalali semantic calendar",
			dailyNoteFormat: "YYYY-MM-DD",
			dateFormat: "jalali" as const,
			path: "Journal/2024-11-05.md",
			basename: "2024-11-05",
			expectedJalali: "1403-08-15",
			expectedGregorian: "2024-11-05",
			expectedWeekday: "سه‌شنبه",
			expectedYear: "1403",
			expectedWeekStart: "1403-08-12", // Saturday in Jalali
		},
		{
			desc: "Gregorian filename (YYYY-MM-DD) + Gregorian semantic calendar",
			dailyNoteFormat: "YYYY-MM-DD",
			dateFormat: "gregorian" as const,
			path: "Journal/2024-11-05.md",
			basename: "2024-11-05",
			expectedJalali: "1403-08-15",
			expectedGregorian: "2024-11-05",
			expectedWeekday: "سه‌شنبه",
			expectedYear: "1403",
			expectedWeekStart: "2024-11-02", // Saturday in Gregorian
		},
		{
			desc: "Jalali filename (jYYYY-jMM-jDD) + Jalali semantic calendar",
			dailyNoteFormat: "jYYYY-jMM-jDD",
			dateFormat: "jalali" as const,
			path: "Journal/1403-08-15.md",
			basename: "1403-08-15",
			expectedJalali: "1403-08-15",
			expectedGregorian: "2024-11-05",
			expectedWeekday: "سه‌شنبه",
			expectedYear: "1403",
			expectedWeekStart: "1403-08-12",
		},
		{
			desc: "Jalali filename (jYYYY-jMM-jDD) + Gregorian semantic calendar",
			dailyNoteFormat: "jYYYY-jMM-jDD",
			dateFormat: "gregorian" as const,
			path: "Journal/1403-08-15.md",
			basename: "1403-08-15",
			expectedJalali: "1403-08-15",
			expectedGregorian: "2024-11-05",
			expectedWeekday: "سه‌شنبه",
			expectedYear: "1403",
			expectedWeekStart: "2024-11-02",
		},
	];

	for (const tc of testCases) {
		it(tc.desc, () => {
			const { placeholder } = createMockPlugin({
				dateFormat: tc.dateFormat,
				dailyNoteFormat: tc.dailyNoteFormat,
			});

			const noteFile = {
				path: tc.path,
				basename: tc.basename,
			} as TFile;

			const template = [
				"{{تاریخ شمسی یادداشت}}",
				"{{تاریخ میلادی یادداشت}}",
				"{{روز هفته یادداشت}}",
				"{{سال یادداشت}}",
				"{{اول هفته}}",
			].join("|");

			const result = placeholder.processPlaceholders(noteFile, template);
			const expected = [
				tc.expectedJalali,
				tc.expectedGregorian,
				tc.expectedWeekday,
				tc.expectedYear,
				tc.expectedWeekStart,
			].join("|");

			expect(result).toBe(expected);
		});
	}
});

describe("Custom daily note filename patterns", () => {
	it("resolves placeholders when dailyNoteFormat uses dot separator", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "YYYY.MM.DD",
		});

		const noteFile = {
			path: "2024.11.05.md",
			basename: "2024.11.05",
		} as TFile;

		const result = placeholder.processPlaceholders(
			noteFile,
			"{{تاریخ شمسی یادداشت}} | {{روز هفته یادداشت}}",
		);
		expect(result).toBe("1403-08-15 | سه‌شنبه");
	});

	it("resolves placeholders when dailyNoteFormat uses prefix and dddd", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD dddd",
		});

		const noteFile = {
			path: "1403-08-15 سه شنبه.md",
			basename: "1403-08-15 سه شنبه",
		} as TFile;

		const result = placeholder.processPlaceholders(
			noteFile,
			"{{تاریخ شمسی یادداشت}} | {{تاریخ میلادی یادداشت}}",
		);
		expect(result).toBe("1403-08-15 | 2024-11-05");
	});
});

describe("Non-dated files behavior", () => {
	it("leaves note placeholders unresolved and resolves current-date placeholders in non-dated files", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
		});

		const regularFile = {
			path: "Projects/MyProject.md",
			basename: "MyProject",
		} as TFile;

		const template = "Current: {{تاریخ شمسی جاری}} | Note: {{تاریخ شمسی یادداشت}}";
		const result = placeholder.processPlaceholders(regularFile, template);

		const todayJalali = dateToDash(todayTehran(), "jalali");
		expect(result).toBe(`Current: ${todayJalali} | Note: {{تاریخ شمسی یادداشت}}`);
	});
});

describe("week number placeholders", () => {
	afterEach(() => vi.useRealTimers());

	it.each(["fa", "en"] as const)(
		"uses English digits and independent dates in %s",
		async (language) => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-20T20:30:00Z"));
			const template = "{{شماره هفته یادداشت}} | {{شماره هفته جاری}} | {{هفته یادداشت}}";
			const { placeholder } = createMockPlugin(
				{ language, weekCalculation: "jalali-first-week-start" },
				{ "template.md": template },
			);
			const daily = Object.assign(new TFile(), { path: "2025-03-22.md", basename: "2025-03-22" });
			expect(await placeholder.getTemplateContent("template.md", daily)).toBe("1 | 52 | 1404-W01");
			const weekly = Object.assign(new TFile(), { path: "1404-W09.md", basename: "1404-W09" });
			expect(placeholder.processPlaceholders(weekly, template)).toBe("9 | 52 | 1404-W09");
			const keys = placeholder.getAllPlaceholderKeys(daily);
			expect(keys).toContain("{{شماره هفته یادداشت}}");
			expect(keys).toContain("{{شماره هفته جاری}}");
			expect(placeholder.toProvider().getSuggestions("شماره هفته")).toEqual([
				"{{شماره هفته جاری}}",
				"{{شماره هفته یادداشت}}",
			]);
		},
	);

	it("leaves the note placeholder unchanged when the note date is unresolved", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-03-22T12:00:00Z"));
		const { placeholder } = createMockPlugin({ weekCalculation: "jalali-first-week-start" });
		const file = Object.assign(new TFile(), { path: "project.md", basename: "project" });
		expect(
			placeholder.processPlaceholders(file, "{{شماره هفته یادداشت}} | {{شماره هفته جاری}}"),
		).toBe("{{شماره هفته یادداشت}} | 1");
	});
});

describe("dashToCalendarDate calendar detection", () => {
	it("detects 2024-11-02 as Gregorian even if dateFormat is jalali", () => {
		const date = dashToCalendarDate("2024-11-02", "jalali");
		expect(date).not.toBeNull();
		expect(date?.toString().startsWith("2024-11-02")).toBe(true);
	});

	it("detects 1403-08-12 as Jalali even if dateFormat is gregorian", () => {
		const date = dashToCalendarDate("1403-08-12", "gregorian");
		expect(date).not.toBeNull();
		// Jalali 1403-08-12 is Gregorian 2024-11-02
		expect(date?.toString().startsWith("2024-11-02")).toBe(true);
	});

	it("returns null for invalid Gregorian dates", () => {
		expect(dashToCalendarDate("2024-02-30", "gregorian")).toBeNull();
		expect(dashToCalendarDate("2024-13-01", "gregorian")).toBeNull();
	});

	it("returns null for invalid Jalali dates", () => {
		expect(dashToCalendarDate("1403-12-31", "jalali")).toBeNull(); // 1403 is not leap, Esfand has 29 days
		expect(dashToCalendarDate("1403-07-31", "jalali")).toBeNull(); // Mehr has 30 days
	});
});

describe("Issue #106: Weekday date placeholders for weekly and daily templates", () => {
	it("resolves all 7 English weekday placeholders with Jalali format in a weekly note", async () => {
		// 1404-W01 under jalali-first-week-start: Saturday 1404-01-02 (2025-03-22) .. Friday 1404-01-08 (2025-03-28)
		const templatePath = "Templates/WeeklyTemplate.md";
		const template = [
			"![[{{saturday:jYYYY-jMM-jDD}}]]",
			"![[{{sunday:jYYYY-jMM-jDD}}]]",
			"![[{{monday:jYYYY-jMM-jDD}}]]",
			"![[{{tuesday:jYYYY-jMM-jDD}}]]",
			"![[{{wednesday:jYYYY-jMM-jDD}}]]",
			"![[{{thursday:jYYYY-jMM-jDD}}]]",
			"![[{{friday:jYYYY-jMM-jDD}}]]",
		].join("\n");

		const { placeholder } = createMockPlugin(
			{
				dateFormat: "jalali",
				dailyNoteFormat: "jYYYY-jMM-jDD",
				weekCalculation: "jalali-first-week-start",
				weeklyTemplatePath: templatePath,
			},
			{ [templatePath]: template },
		);

		const weeklyFile = Object.assign(new TFile(), {
			path: "Journal/1404/Weekly/1404-W01.md",
			basename: "1404-W01",
		});

		const resolved = await placeholder.getTemplateContent(templatePath, weeklyFile);
		expect(resolved).toBe(
			[
				"![[1404-01-02]]",
				"![[1404-01-03]]",
				"![[1404-01-04]]",
				"![[1404-01-05]]",
				"![[1404-01-06]]",
				"![[1404-01-07]]",
				"![[1404-01-08]]",
			].join("\n"),
		);
	});

	it("supports Gregorian, custom, and literal-escaped formats as well as case-insensitive weekday names", () => {
		const { placeholder } = createMockPlugin({
			weekCalculation: "jalali-first-week-start",
		});

		const weeklyFile = Object.assign(new TFile(), {
			path: "1404-W01.md",
			basename: "1404-W01",
		});

		const content = [
			"{{Saturday:YYYY-MM-DD}}",
			"{{SUNDAY:jYYYY/jMM/jDD}}",
			"{{monday:[Daily] jDD jMMMM jYYYY}}",
			"{{FRIDAY:YYYY-MM-DD (DDDD)}}",
		].join("\n");

		expect(placeholder.processPlaceholders(weeklyFile, content)).toBe(
			["2025-03-22", "1404/01/03", "Daily 04 Farvardin 1404", "2025-03-28 (Friday)"].join("\n"),
		);
	});

	it("supports Persian weekday names with and without ZWNJ and optional format", () => {
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD",
			weekCalculation: "jalali-first-week-start",
		});

		const weeklyFile = Object.assign(new TFile(), {
			path: "1404-W01.md",
			basename: "1404-W01",
		});

		const content = [
			"{{شنبه}}",
			"{{یکشنبه}}",
			"{{یک‌شنبه:jYYYY/jMM/jDD}}",
			"{{دوشنبه}}",
			"{{سه‌شنبه}}",
			"{{سه شنبه:YYYY-MM-DD}}",
			"{{چهارشنبه}}",
			"{{پنج‌شنبه}}",
			"{{پنجشنبه:jYYYY/jMM/jDD}}",
			"{{جمعه}}",
		].join("\n");

		expect(placeholder.processPlaceholders(weeklyFile, content)).toBe(
			[
				"1404-01-02",
				"1404-01-03",
				"1404/01/03",
				"1404-01-04",
				"1404-01-05",
				"2025-03-25",
				"1404-01-06",
				"1404-01-07",
				"1404/01/07",
				"1404-01-08",
			].join("\n"),
		);
	});

	it("uses dailyNoteFormat when format is omitted and falls back to dateFormat when dailyNoteFormat is empty", () => {
		const weeklyFile = Object.assign(new TFile(), {
			path: "1404-W01.md",
			basename: "1404-W01",
		});

		const { placeholder: withDailyFormat } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY.jMM.jDD",
			weekCalculation: "jalali-first-week-start",
		});
		expect(withDailyFormat.processPlaceholders(weeklyFile, "{{saturday}} | {{friday}}")).toBe(
			"1404.01.02 | 1404.01.08",
		);

		const { placeholder: fallbackJalali } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "",
			weekCalculation: "jalali-first-week-start",
		});
		expect(fallbackJalali.processPlaceholders(weeklyFile, "{{saturday}}")).toBe("1404-01-02");

		const { placeholder: fallbackGregorian } = createMockPlugin({
			dateFormat: "gregorian",
			dailyNoteFormat: "",
			weekCalculation: "jalali-first-week-start",
		});
		expect(fallbackGregorian.processPlaceholders(weeklyFile, "{{saturday}}")).toBe("2025-03-22");
	});

	it("handles Jalali year-boundary week under jalali-first-day-of-year", () => {
		// 1404-01-01 is Friday (2025-03-21), so week 1 starts Saturday 1403-12-25 (2025-03-15)
		const { placeholder } = createMockPlugin({
			weekCalculation: "jalali-first-day-of-year",
		});

		const weeklyFile = Object.assign(new TFile(), {
			path: "1404-W01.md",
			basename: "1404-W01",
		});

		expect(
			placeholder.processPlaceholders(
				weeklyFile,
				"{{saturday:jYYYY-jMM-jDD}} .. {{friday:jYYYY-jMM-jDD}}",
			),
		).toBe("1403-12-25 .. 1404-01-01");
	});

	it("handles Gregorian week calculation modes and formats Jalali dates accurately", () => {
		// 2025-01-01 is Wednesday; first Saturday of 2025 is 2025-01-04 (1403-10-15)
		const { placeholder: firstWeekStart } = createMockPlugin({
			weekCalculation: "gregorian-first-week-start",
		});
		const gWeekly = Object.assign(new TFile(), {
			path: "2025-W01.md",
			basename: "2025-W01",
		});
		expect(
			firstWeekStart.processPlaceholders(
				gWeekly,
				"{{saturday:YYYY-MM-DD}} ({{saturday:jYYYY-jMM-jDD}}) .. {{friday:YYYY-MM-DD}}",
			),
		).toBe("2025-01-04 (1403-10-15) .. 2025-01-10");

		// Under gregorian-first-day-of-year, week containing 2025-01-01 starts Saturday 2024-12-28 (1403-10-08)
		const { placeholder: firstDayOfYear } = createMockPlugin({
			weekCalculation: "gregorian-first-day-of-year",
		});
		expect(
			firstDayOfYear.processPlaceholders(
				gWeekly,
				"{{saturday:YYYY-MM-DD}} ({{saturday:jYYYY-jMM-jDD}}) .. {{friday:YYYY-MM-DD}}",
			),
		).toBe("2024-12-28 (1403-10-08) .. 2025-01-03");
	});

	it("resolves weekday placeholders inside daily notes relative to the daily note's week", () => {
		// 1404-01-05 is Tuesday of 1404-W01 (Saturday 1404-01-02 .. Friday 1404-01-08)
		const { placeholder } = createMockPlugin({
			dateFormat: "jalali",
			dailyNoteFormat: "jYYYY-jMM-jDD",
			weekCalculation: "jalali-first-week-start",
		});

		const dailyFile = Object.assign(new TFile(), {
			path: "1404-01-05.md",
			basename: "1404-01-05",
		});

		expect(
			placeholder.processPlaceholders(
				dailyFile,
				"{{saturday:jYYYY-jMM-jDD}} | {{tuesday:jYYYY-jMM-jDD}} | {{friday:jYYYY-jMM-jDD}}",
			),
		).toBe("1404-01-02 | 1404-01-05 | 1404-01-08");
	});

	it("leaves weekday placeholders untouched in non-dated/non-weekly notes and ignores unknown or empty formats", () => {
		const { placeholder } = createMockPlugin({
			weekCalculation: "jalali-first-week-start",
		});

		const regularFile = Object.assign(new TFile(), {
			path: "Projects/MyProject.md",
			basename: "MyProject",
		});
		expect(placeholder.processPlaceholders(regularFile, "{{saturday:jYYYY-jMM-jDD}}")).toBe(
			"{{saturday:jYYYY-jMM-jDD}}",
		);

		const monthlyFile = Object.assign(new TFile(), {
			path: "1404-01.md",
			basename: "1404-01",
		});
		expect(placeholder.processPlaceholders(monthlyFile, "{{saturday:jYYYY-jMM-jDD}}")).toBe(
			"{{saturday:jYYYY-jMM-jDD}}",
		);

		const weeklyFile = Object.assign(new TFile(), {
			path: "1404-W01.md",
			basename: "1404-W01",
		});
		expect(
			placeholder.processPlaceholders(
				weeklyFile,
				"{{unknown:jYYYY-jMM-jDD}} | {{saturday:}} | {{saturday:   }}",
			),
		).toBe("{{unknown:jYYYY-jMM-jDD}} | {{saturday:}} | {{saturday:   }}");
	});

	it("exposes weekday placeholders in autocomplete suggestions", () => {
		const { placeholder } = createMockPlugin();
		const keys = placeholder.getAllPlaceholderKeys();

		expect(keys).toContain("{{saturday:jYYYY-jMM-jDD}}");
		expect(keys).toContain("{{friday:jYYYY-jMM-jDD}}");
		expect(keys).toContain("{{شنبه}}");
		expect(keys).toContain("{{جمعه}}");

		expect(placeholder.toProvider().getSuggestions("Sat")).toEqual(["{{saturday:jYYYY-jMM-jDD}}"]);
		expect(placeholder.toProvider().getSuggestions("جمعه")).toEqual(["{{جمعه}}"]);
	});
});
