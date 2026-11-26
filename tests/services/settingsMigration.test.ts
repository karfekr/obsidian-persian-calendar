import { DEFAULT_SETTING } from "src/constants";
import {
	applySettingsMigrations,
	migrateV4PathPatternsToV5,
	migrateV4PathPatternToV5,
} from "src/services/SettingsMigration";
import type { TDateEngineContext, TSetting } from "src/types";
import { formatPattern } from "src/utils/dateEngine";

describe("migrateV4PathPatternToV5", () => {
	it("migrates v4 default path patterns to v5 bracketed syntax", () => {
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[Daily]")).toBe("Journal/[jYYYY]/Daily");
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[Weekly]")).toBe("Journal/[jYYYY]/Weekly");
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[Monthly]")).toBe("Journal/[jYYYY]/Monthly");
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[Seasonal]")).toBe("Journal/[jYYYY]/Seasonal");
		expect(migrateV4PathPatternToV5("Journal/jYYYY")).toBe("Journal/[jYYYY]");
	});

	it("cleans up v3->v4 escaped single-letter literals back to plain words", () => {
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[D]aily")).toBe("Journal/[jYYYY]/Daily");
		expect(migrateV4PathPatternToV5("Journal/jYYYY/[M]onthly")).toBe("Journal/[jYYYY]/Monthly");
	});

	it("migrates complex custom v4 paths while preserving exact formatted output", () => {
		const context: TDateEngineContext = {
			jy: 1403,
			jm: 8,
			jd: 12,
			gy: 2024,
			gm: 11,
			gd: 2,
			week: 33,
			season: 3,
			quarter: 4,
			dow: 6,
		};

		const v4Patterns = [
			"Journal/jYYYY/[Daily]",
			"[03 - Diary]/jYYYY/jMM - jMMMM/jYYYY-[W]ww",
			"[Weekly]/[W]ww",
			"jYYYY/[W]ww",
			"[Custom]/[week-]w/[padded-]ww",
			"YYYY/MMMM/jMM/ww",
			"Journal/jYYYY/jQQQQ",
			"[My] [Static] [Folder]",
			"Journal/jYYYY/Daily",
			"",
		];

		for (const v4Pattern of v4Patterns) {
			const v5Pattern = migrateV4PathPatternToV5(v4Pattern);
			expect(formatPattern(v5Pattern, context, "bracketed")).toBe(
				formatPattern(v4Pattern, context, "standard"),
			);
		}
	});
});

describe("applySettingsMigrations", () => {
	it("does not corrupt v5 defaults on a fresh install (rawStoredData is null)", () => {
		const result = applySettingsMigrations(null);

		expect(result.dailyNotesPath).toBe("Journal/[jYYYY]/Daily");
		expect(result.weeklyNotesPath).toBe("Journal/[jYYYY]/Weekly");
		expect(result.monthlyNotesPath).toBe("Journal/[jYYYY]/Monthly");
		expect(result.seasonalNotesPath).toBe("Journal/[jYYYY]/Seasonal");
		expect(result.yearlyNotesPath).toBe("Journal/[jYYYY]");
		expect(result.showInNoteNavigation).toBe(true);
		expect(result.legacyPathPatternsMigrated).toBe(true);
		expect(result.bracketedPathPatternsMigrated).toBe(true);
	});

	it("migrates v4 user settings to v5 bracketed paths and preserves dailyNoteFormat", () => {
		const rawV4: Partial<TSetting> = {
			legacyPathPatternsMigrated: true,
			dailyNoteFormat: "YYYY-MM-DD",
			dailyNotesPath: "[03 - Diary]/jYYYY/jMM - jMMMM/jYYYY-[W]ww",
			weeklyNotesPath: "Journal/jYYYY/[Weekly]",
			monthlyNotesPath: "Journal/jYYYY/[Monthly]",
			seasonalNotesPath: "Journal/jYYYY/[Seasonal]",
			yearlyNotesPath: "Journal/jYYYY",
		};

		const result = applySettingsMigrations(rawV4);

		expect(result.dailyNotesPath).toBe("03 - Diary/[jYYYY]/[jMM] - [jMMMM]/[jYYYY]-W[ww]");
		expect(result.weeklyNotesPath).toBe("Journal/[jYYYY]/Weekly");
		expect(result.monthlyNotesPath).toBe("Journal/[jYYYY]/Monthly");
		expect(result.seasonalNotesPath).toBe("Journal/[jYYYY]/Seasonal");
		expect(result.yearlyNotesPath).toBe("Journal/[jYYYY]");
		expect(result.dailyNoteFormat).toBe("YYYY-MM-DD");
		expect(result.bracketedPathPatternsMigrated).toBe(true);
	});

	it("only migrates path keys that were actually stored in v4 data.json", () => {
		const rawPartialV4: Partial<TSetting> = {
			legacyPathPatternsMigrated: true,
			dailyNotesPath: "Notes/jYYYY/[Daily]",
		};

		const result = applySettingsMigrations(rawPartialV4);

		expect(result.dailyNotesPath).toBe("Notes/[jYYYY]/Daily");
		// Unstored keys came from v5 DEFAULT_SETTING and must not be double-migrated
		expect(result.weeklyNotesPath).toBe("Journal/[jYYYY]/Weekly");
		expect(result.monthlyNotesPath).toBe("Journal/[jYYYY]/Monthly");
		expect(result.seasonalNotesPath).toBe("Journal/[jYYYY]/Seasonal");
		expect(result.yearlyNotesPath).toBe("Journal/[jYYYY]");
	});

	it("cleanly chains v3 -> v4 -> v5 migration for users upgrading directly from v3", () => {
		const rawV3: Partial<TSetting> = {
			dateFormat: "jalali",
			dailyNotesPath: "Journal/jYYYY/Daily",
			monthlyNotesPath: "Journal/jYYYY/Monthly",
			yearlyNotesPath: "Journal/jYYYY",
		};

		const result = applySettingsMigrations(rawV3);

		expect(result.dailyNotesPath).toBe("Journal/[jYYYY]/Daily");
		expect(result.monthlyNotesPath).toBe("Journal/[jYYYY]/Monthly");
		expect(result.yearlyNotesPath).toBe("Journal/[jYYYY]");
		expect(result.dailyNoteFormat).toBe("jYYYY-jMM-jDD");
		expect(result.legacyPathPatternsMigrated).toBe(true);
		expect(result.bracketedPathPatternsMigrated).toBe(true);
	});

	it("is a no-op when already migrated to v5", () => {
		const rawV5: Partial<TSetting> = {
			legacyPathPatternsMigrated: true,
			bracketedPathPatternsMigrated: true,
			dailyNotesPath: "Journal/[jYYYY]/Daily",
			weeklyNotesPath: "Journal/[jYYYY]/Weekly",
		};

		const result = applySettingsMigrations(rawV5);

		expect(result.dailyNotesPath).toBe("Journal/[jYYYY]/Daily");
		expect(result.weeklyNotesPath).toBe("Journal/[jYYYY]/Weekly");
		expect(result.showInNoteNavigation).toBe(true);
	});

	it("preserves an explicit opt-out of in-note navigation", () => {
		expect(applySettingsMigrations({ showInNoteNavigation: false }).showInNoteNavigation).toBe(
			false,
		);
	});

	it("migrateV4PathPatternsToV5 migrates all 5 path keys by default", () => {
		const v4Setting: TSetting = {
			...DEFAULT_SETTING,
			dailyNotesPath: "Journal/jYYYY/[Daily]",
			weeklyNotesPath: "Journal/jYYYY/[Weekly]",
			monthlyNotesPath: "Journal/jYYYY/[Monthly]",
			seasonalNotesPath: "Journal/jYYYY/[Seasonal]",
			yearlyNotesPath: "Journal/jYYYY",
		};

		const migrated = migrateV4PathPatternsToV5(v4Setting);

		expect(migrated.dailyNotesPath).toBe("Journal/[jYYYY]/Daily");
		expect(migrated.weeklyNotesPath).toBe("Journal/[jYYYY]/Weekly");
		expect(migrated.monthlyNotesPath).toBe("Journal/[jYYYY]/Monthly");
		expect(migrated.seasonalNotesPath).toBe("Journal/[jYYYY]/Seasonal");
		expect(migrated.yearlyNotesPath).toBe("Journal/[jYYYY]");
	});
});
