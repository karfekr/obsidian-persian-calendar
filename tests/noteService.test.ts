const dailyNotesMocks = vi.hoisted(() => ({
	appHasDailyNotesPluginLoaded: vi.fn(),
	createDailyNote: vi.fn(),
	getAllDailyNotes: vi.fn(),
	getDailyNote: vi.fn(),
	getDailyNoteSettings: vi.fn(),
	getDateFromFile: vi.fn(),
	getDateUID: vi.fn(),
}));

const componentMocks = vi.hoisted(() => ({
	createNoteModal: vi.fn(),
	Notice: vi.fn(),
}));

vi.mock("obsidian-daily-notes-interface", () => dailyNotesMocks);

vi.mock("src/components", () => componentMocks);

vi.mock("obsidian", () => {
	class TFile {}
	class TFolder {}
	class MarkdownView {}

	return {
		App: class {},
		MarkdownView,
		normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/^\/+/, ""),
		TFile,
		TFolder,
	};
});

import type { App } from "obsidian";
import { TFile } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NoteService from "src/services/NoteService";
import type { TSetting } from "src/types";

class FakeMoment {
	constructor(
		private readonly value: Date,
		private readonly valid = true,
	) {}

	startOf() {
		return this;
	}

	year() {
		return this.value.getUTCFullYear();
	}

	month() {
		return this.value.getUTCMonth();
	}

	date() {
		return this.value.getUTCDate();
	}

	isValid() {
		return this.valid;
	}

	format(format: string) {
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const replacements: Record<string, string> = {
			YYYY: this.year().toString(),
			MMM: monthNames[this.month()],
			MM: (this.month() + 1).toString().padStart(2, "0"),
			DD: this.date().toString().padStart(2, "0"),
		};

		return format.replace(/YYYY|MMM|MM|DD/g, (token) => replacements[token]);
	}
}

function momentFor(gy: number, gm: number, gd: number) {
	return new FakeMoment(new Date(Date.UTC(gy, gm - 1, gd, 12)));
}

function parseMoment(input: string, format: string) {
	if (format === "YYYY/MM/DD") {
		const match = input.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);

		if (match) {
			return momentFor(Number(match[1]), Number(match[2]), Number(match[3]));
		}
	}

	return new FakeMoment(new Date(0), false);
}

function createFile(path: string): TFile {
	const file = new TFile();
	const name = path.split("/").pop() ?? path;

	Object.assign(file, {
		basename: name.replace(/\.md$/, ""),
		extension: "md",
		name,
		path,
	});

	return file;
}

function createService(settingOverrides: Partial<TSetting> = {}, files: TFile[] = []) {
	const filesByPath = new Map(files.map((file) => [file.path, file]));
	const openFile = vi.fn();
	const create = vi.fn(async (path: string) => createFile(path));
	const app = {
		vault: {
			create,
			createFolder: vi.fn(),
			getAbstractFileByPath: vi.fn((path: string) => filesByPath.get(path) ?? null),
			modify: vi.fn(),
		},
		workspace: {
			getActiveViewOfType: vi.fn(() => null),
			getLeavesOfType: vi.fn(() => []),
			getMostRecentLeaf: vi.fn(() => ({ openFile })),
			setActiveLeaf: vi.fn(),
		},
	};
	const plugin = {
		placeholder: {
			getTemplateContent: vi.fn(),
		},
		refreshViews: vi.fn(),
		setting: {
			...DEFAULT_SETTING,
			...settingOverrides,
		},
	};

	return {
		app,
		create,
		openFile,
		plugin,
		service: new NoteService(app as unknown as App, plugin as unknown as PersianCalendarPlugin),
	};
}

describe("NoteService Daily Notes integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: {
				moment: (input: { year: number; month: number; day: number } | string, format?: string) =>
					typeof input === "string"
						? parseMoment(input, format ?? "")
						: momentFor(input.year, input.month + 1, input.day),
			},
		});

		dailyNotesMocks.appHasDailyNotesPluginLoaded.mockReturnValue(true);
		dailyNotesMocks.getAllDailyNotes.mockReturnValue({});
		dailyNotesMocks.getDailyNote.mockImplementation(
			(date: FakeMoment, notes: Record<string, TFile>) => notes[date.format("YYYY-MM-DD")] ?? null,
		);
		dailyNotesMocks.getDailyNoteSettings.mockReturnValue({
			folder: "Oss Ahmad Journal",
			format: "MMM DD, YYYY",
			template: "Templates/Daily Note.md",
		});
		dailyNotesMocks.getDateFromFile.mockReturnValue(null);
		dailyNotesMocks.getDateUID.mockImplementation(
			(date: FakeMoment) => `day-${date.format("YYYY-MM-DD")}`,
		);
		componentMocks.createNoteModal.mockResolvedValue(true);
	});

	it("defaults the integration setting to false", () => {
		expect(DEFAULT_SETTING.useObsidianDailyNotes).toBe(false);
	});

	it("keeps legacy daily-note discovery unchanged when disabled", () => {
		const legacyFile = createFile("Journal/1405/Daily/2026-07-12.md");
		const { service } = createService(
			{
				dailyNotesPath: "Journal/jYYYY/Daily",
				dateFormat: "gregorian",
				useObsidianDailyNotes: false,
			},
			[legacyFile],
		);

		expect(service.getDaysWithNotes(1405, 4)).toContain(21);
		expect(dailyNotesMocks.getAllDailyNotes).not.toHaveBeenCalled();
	});

	it("keeps legacy daily-note creation on the configured Persian Calendar path", async () => {
		const { create, service } = createService({
			askForCreateNote: false,
			dailyNotesPath: "Journal/jYYYY/Daily",
			dateFormat: "gregorian",
			useObsidianDailyNotes: false,
		});

		await service.openOrCreateDailyNote(1405, 4, 21);

		expect(create).toHaveBeenCalledWith("Journal/1405/Daily/2026-07-12.md", "");
		expect(dailyNotesMocks.createDailyNote).not.toHaveBeenCalled();
	});

	it("maps a Jalali month to canonical Daily Notes with one vault scan", () => {
		const dailyFile = createFile("Oss Ahmad Journal/Jul 12, 2026.md");
		dailyNotesMocks.getAllDailyNotes.mockReturnValue({
			"2026-07-12": dailyFile,
		});
		const { service } = createService({ useObsidianDailyNotes: true });

		const days = service.getDaysWithNotes(1405, 4);

		expect(days).toContain(21);
		expect(dailyNotesMocks.getAllDailyNotes).toHaveBeenCalledTimes(1);
		expect(dailyNotesMocks.getDailyNote).toHaveBeenCalledWith(
			expect.objectContaining({}),
			expect.objectContaining({ "2026-07-12": dailyFile }),
		);
	});

	it("converts an active canonical Daily Note back to Jalali", () => {
		const dailyFile = createFile("Oss Ahmad Journal/Jul 12, 2026.md");
		const unrelatedFile = createFile("Archive/Jul 12, 2026.md");
		const date = momentFor(2026, 7, 12);
		dailyNotesMocks.getDateFromFile.mockReturnValue(date);
		dailyNotesMocks.getAllDailyNotes.mockReturnValue({
			"2026-07-12": dailyFile,
		});
		const { service } = createService({ useObsidianDailyNotes: true });

		expect(service.getDailyNoteDate(dailyFile)).toEqual({ jy: 1405, jm: 4, jd: 21 });
		expect(service.getDailyNoteDate(unrelatedFile)).toBeNull();
	});

	it("recognizes canonical Daily Notes whose format creates nested folders", () => {
		const dailyFile = createFile("Journal/2026/07/12.md");
		dailyNotesMocks.getDailyNoteSettings.mockReturnValue({
			folder: "Journal",
			format: "YYYY/MM/DD",
			template: "",
		});
		dailyNotesMocks.getDailyNote.mockImplementation(
			(date: FakeMoment, notes: Record<string, TFile>) =>
				notes[`day-${date.format("YYYY-MM-DD")}`] ?? null,
		);
		const { service } = createService({ useObsidianDailyNotes: true }, [dailyFile]);

		expect(service.getDaysWithNotes(1405, 4)).toContain(21);
		expect(service.getDailyNoteDate(dailyFile)).toEqual({ jy: 1405, jm: 4, jd: 21 });
		expect(dailyNotesMocks.getAllDailyNotes).toHaveBeenCalledTimes(2);
	});

	it("handles a missing configured Daily Notes folder without throwing", () => {
		dailyNotesMocks.getAllDailyNotes.mockImplementation(() => {
			throw new Error("Missing Daily Notes folder");
		});
		const { service } = createService({ useObsidianDailyNotes: true });

		expect(() => service.getDaysWithNotes(1405, 4)).not.toThrow();
		expect(service.getDaysWithNotes(1405, 4)).toEqual([]);
	});

	it("creates and opens only the Daily Notes canonical file", async () => {
		const dailyFile = createFile("Oss Ahmad Journal/Jul 12, 2026.md");
		dailyNotesMocks.createDailyNote.mockResolvedValue(dailyFile);
		const { create, openFile, plugin, service } = createService({
			askForCreateNote: false,
			useObsidianDailyNotes: true,
		});

		await service.openOrCreateDailyNote(1405, 4, 21);

		expect(dailyNotesMocks.createDailyNote).toHaveBeenCalledTimes(1);
		expect(dailyNotesMocks.createDailyNote.mock.calls[0][0].format("YYYY-MM-DD")).toBe(
			"2026-07-12",
		);
		expect(create).not.toHaveBeenCalled();
		expect(plugin.placeholder.getTemplateContent).not.toHaveBeenCalled();
		expect(openFile).toHaveBeenCalledWith(dailyFile);
		expect(plugin.refreshViews).toHaveBeenCalledTimes(1);
	});

	it("shows a localized Notice and never falls back when Daily Notes is unavailable", async () => {
		dailyNotesMocks.appHasDailyNotesPluginLoaded.mockReturnValue(false);
		const { create, service } = createService({
			askForCreateNote: false,
			useObsidianDailyNotes: true,
		});

		await service.openOrCreateDailyNote(1405, 4, 21);

		expect(componentMocks.Notice).toHaveBeenCalledWith(
			"Enable and configure Obsidian Daily Notes or the daily feature in Periodic Notes to use this integration.",
			"ltr",
		);
		expect(dailyNotesMocks.createDailyNote).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
	});
});
