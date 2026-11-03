import type { App } from "obsidian";
import { TFile } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NoteService from "src/services/NoteService";
import Placeholder from "src/services/Placeholder";
import type { TSetting } from "src/types";
import { dashToDate, dateToDash } from "src/utils/dashUtils";
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
			dailyNotesPath: "Journal/jYYYY/[Daily]",
		});

		const noteFile = {
			path: "Journal/1403/[Daily]/1403-08-15.md",
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
			dailyNotesPath: "[03 - Diary]/jYYYY/jMM - jMMMM/jYYYY-[W]ww",
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

describe("dashToDate calendar detection", () => {
	it("detects 2024-11-02 as Gregorian even if dateFormat is jalali", () => {
		const date = dashToDate("2024-11-02", "jalali");
		expect(date).not.toBeNull();
		expect(date?.toISOString().startsWith("2024-11-02")).toBe(true);
	});

	it("detects 1403-08-12 as Jalali even if dateFormat is gregorian", () => {
		const date = dashToDate("1403-08-12", "gregorian");
		expect(date).not.toBeNull();
		// Jalali 1403-08-12 is Gregorian 2024-11-02
		expect(date?.toISOString().startsWith("2024-11-02")).toBe(true);
	});

	it("returns null for invalid Gregorian dates", () => {
		expect(dashToDate("2024-02-30", "gregorian")).toBeNull();
		expect(dashToDate("2024-13-01", "gregorian")).toBeNull();
	});

	it("returns null for invalid Jalali dates", () => {
		expect(dashToDate("1403-12-31", "jalali")).toBeNull(); // 1403 is not leap, Esfand has 29 days
		expect(dashToDate("1403-07-31", "jalali")).toBeNull(); // Mehr has 30 days
	});
});
