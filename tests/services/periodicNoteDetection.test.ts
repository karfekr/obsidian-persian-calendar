import type { App } from "obsidian";
import { TFile } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NoteService from "src/services/NoteService";
import type { TSetting } from "src/types";
import { describe, expect, it } from "vitest";

function createNoteService(overrides: Partial<TSetting> = {}) {
	const setting: TSetting = { ...DEFAULT_SETTING, ...overrides };
	const plugin = { setting } as unknown as PersianCalendarPlugin;
	const app = {} as unknown as App;
	return new NoteService(app, plugin);
}

function makeFile(path: string): TFile {
	const file = new TFile();
	file.path = path;
	file.basename =
		path
			.split("/")
			.pop()
			?.replace(/\.[^/.]+$/, "") ?? "";
	return file;
}

describe("NoteService.getPeriodicNoteInfo", () => {
	it("detects daily notes with default Gregorian filename and dynamic Jalali folder", () => {
		const service = createNoteService();
		const file = makeFile("Journal/1405/Daily/2026-11-24.md");

		expect(service.getPeriodicNoteInfo(file)).toEqual({
			type: "daily",
			jy: 1405,
			jm: 9,
			jd: 3,
		});
	});

	it("detects daily notes with Jalali filename format", () => {
		const service = createNoteService({
			dailyNoteFormat: "jYYYY-jMM-jDD",
			dailyNotesPath: "Daily",
		});
		const file = makeFile("Daily/1405-09-03.md");

		expect(service.getPeriodicNoteInfo(file)).toEqual({
			type: "daily",
			jy: 1405,
			jm: 9,
			jd: 3,
		});
	});

	it("detects weekly notes (padded and legacy unpadded)", () => {
		const service = createNoteService();
		const padded = makeFile("Journal/1405/Weekly/1405-W05.md");
		const legacy = makeFile("Journal/1405/Weekly/1405-W5.md");

		const paddedInfo = service.getPeriodicNoteInfo(padded);
		const legacyInfo = service.getPeriodicNoteInfo(legacy);

		expect(paddedInfo).toMatchObject({
			type: "weekly",
			weekYear: 1405,
			weekNumber: 5,
		});
		expect(legacyInfo).toEqual(paddedInfo);
	});

	it("detects monthly notes in Jalali naming mode", () => {
		const service = createNoteService({ monthlyNoteNaming: "jalali" });
		const file = makeFile("Journal/1405/Monthly/1405-09.md");

		expect(service.getPeriodicNoteInfo(file)).toEqual({
			type: "monthly",
			jy: 1405,
			jm: 9,
		});
	});

	it("detects monthly notes in Gregorian naming mode", () => {
		const service = createNoteService({ monthlyNoteNaming: "gregorian" });
		const fileAzar = makeFile("Journal/1405/Monthly/2026-11.md");
		const fileBahman = makeFile("Journal/1405/Monthly/2027-01.md");

		expect(service.getPeriodicNoteInfo(fileAzar)).toEqual({
			type: "monthly",
			jy: 1405,
			jm: 9,
		});
		expect(service.getPeriodicNoteInfo(fileBahman)).toEqual({
			type: "monthly",
			jy: 1405,
			jm: 11,
		});
	});

	it("detects yearly notes in Jalali and Gregorian naming modes", () => {
		const jalaliService = createNoteService({ yearlyNoteNaming: "jalali" });
		expect(jalaliService.getPeriodicNoteInfo(makeFile("Journal/1405/1405.md"))).toEqual({
			type: "yearly",
			jy: 1405,
		});

		const gregorianService = createNoteService({ yearlyNoteNaming: "gregorian" });
		expect(gregorianService.getPeriodicNoteInfo(makeFile("Journal/1405/2026.md"))).toEqual({
			type: "yearly",
			jy: 1405,
		});
	});

	it("returns null for non-periodic notes even with date-like basenames outside configured paths", () => {
		const service = createNoteService();

		expect(service.getPeriodicNoteInfo(makeFile("Notes/Ideas.md"))).toBeNull();
		expect(service.getPeriodicNoteInfo(makeFile("Archive/2026-11-24.md"))).toBeNull();
		expect(service.getPeriodicNoteInfo(makeFile("Archive/1405-W05.md"))).toBeNull();
		expect(service.getPeriodicNoteInfo(makeFile("Archive/1405-09.md"))).toBeNull();
		expect(service.getPeriodicNoteInfo(makeFile("Archive/1405.md"))).toBeNull();
	});
});
