import type { App, TAbstractFile } from "obsidian";
import { TFile } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import { setLocal } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import NoteService from "src/services/NoteService";
import CalendarBodyRender from "src/templates/CalendarView/CalendarRenderer/CalendarBody";
import { openNoteContextMenu } from "src/templates/CalendarView/CalendarRenderer/noteContextMenu";
import type { TSetting } from "src/types";

const confirmModalMock = vi.fn();
const noticeMock = vi.fn();

vi.mock("src/components", () => ({
	createNoteModal: (...args: unknown[]) => confirmModalMock(...args),
	Notice: (...args: unknown[]) => noticeMock(...args),
}));

const menuItems: Array<{
	title?: string;
	icon?: string;
	warning?: boolean;
	onClick?: () => void;
}> = [];
const separatorCalls = vi.fn();
const showAtMouseEventMock = vi.fn();

vi.mock("obsidian", async (importOriginal) => {
	const actual = await importOriginal<typeof import("obsidian")>();

	class MenuItemMock {
		private record: (typeof menuItems)[number] = {};
		constructor() {
			menuItems.push(this.record);
		}
		setTitle(title: string) {
			this.record.title = title;
			return this;
		}
		setIcon(icon: string) {
			this.record.icon = icon;
			return this;
		}
		setWarning(warning: boolean) {
			this.record.warning = warning;
			return this;
		}
		onClick(cb: () => void) {
			this.record.onClick = cb;
			return this;
		}
	}

	class MenuMock {
		dom = {
			setAttribute: vi.fn(),
			style: { textAlign: "" },
		};
		setUseNativeMenu() {
			return this;
		}
		addItem(cb: (item: MenuItemMock) => void) {
			cb(new MenuItemMock());
			return this;
		}
		addSeparator() {
			separatorCalls();
			return this;
		}
		showAtMouseEvent(event: MouseEvent) {
			showAtMouseEventMock(event);
		}
	}

	return {
		...actual,
		Menu: MenuMock,
	};
});

function createHarness(settingOverrides: Partial<TSetting> = {}) {
	const files = new Map<string, TAbstractFile>();
	const addFile = (path: string) => {
		const file = Object.assign(new TFile(), {
			path,
			basename: path.split("/").pop()?.replace(/\.md$/, "") ?? "",
		});
		files.set(path, file);
		return file;
	};

	const trashFile = vi.fn(async (file: TAbstractFile) => {
		files.delete(file.path);
	});

	const app = {
		vault: {
			getAbstractFileByPath: (path: string) => files.get(path) ?? null,
		},
		fileManager: {
			trashFile,
		},
	} as unknown as App;

	const setting: TSetting = {
		...DEFAULT_SETTING,
		language: "en",
		askForDeleteNote: true,
		dailyNotesPath: "Daily",
		weeklyNotesPath: "Weekly",
		monthlyNotesPath: "Monthly",
		seasonalNotesPath: "Seasonal",
		yearlyNotesPath: "Yearly",
		...settingOverrides,
	};
	setLocal(setting.language);

	const plugin = {
		app,
		setting,
		refreshViews: vi.fn(),
	} as unknown as PersianCalendarPlugin;

	const service = new NoteService(app, plugin);
	return { service, plugin, files, addFile, trashFile };
}

beforeEach(() => {
	confirmModalMock.mockReset();
	noticeMock.mockReset();
	menuItems.length = 0;
	separatorCalls.mockReset();
	showAtMouseEventMock.mockReset();
});

describe("NoteService periodic note deletion", () => {
	it("finds and deletes a weekly note after confirmation", async () => {
		const { service, plugin, addFile, trashFile } = createHarness();
		const file = addFile("Weekly/1403-W05.md");
		confirmModalMock.mockResolvedValue(true);

		expect(service.getWeeklyNoteFile(1403, 5)).toBe(file);

		await service.deleteWeeklyNote(1403, 5);

		expect(confirmModalMock).toHaveBeenCalledWith(plugin.app, {
			title: "Delete Weekly Note",
			message: "Delete weekly note for week 05 of 1403?",
		});
		expect(trashFile).toHaveBeenCalledWith(file);
		expect(plugin.refreshViews).toHaveBeenCalledTimes(1);
	});

	it("deletes legacy unpadded weekly notes", async () => {
		const { service, addFile, trashFile } = createHarness({ askForDeleteNote: false });
		const file = addFile("Weekly/1403-W5.md");

		await service.deleteWeeklyNote(1403, 5);

		expect(confirmModalMock).not.toHaveBeenCalled();
		expect(trashFile).toHaveBeenCalledWith(file);
	});

	it("finds and deletes a monthly note after confirmation", async () => {
		const { service, plugin, addFile, trashFile } = createHarness();
		const file = addFile("Monthly/1403-01.md");
		confirmModalMock.mockResolvedValue(true);

		expect(service.getMonthlyNoteFile(1403, 1)).toBe(file);

		await service.deleteMonthlyNote(1403, 1);

		expect(confirmModalMock).toHaveBeenCalledWith(plugin.app, {
			title: "Delete Monthly Note",
			message: "Delete monthly note for Farvardin 1403?",
		});
		expect(trashFile).toHaveBeenCalledWith(file);
		expect(plugin.refreshViews).toHaveBeenCalledTimes(1);
	});

	it("finds and deletes a seasonal note after confirmation", async () => {
		const { service, plugin, addFile, trashFile } = createHarness();
		const file = addFile("Seasonal/1403-S2.md");
		confirmModalMock.mockResolvedValue(true);

		expect(service.getSeasonalNoteFile(1403, 2)).toBe(file);

		await service.deleteSeasonalNote(1403, 2);

		expect(confirmModalMock).toHaveBeenCalledWith(plugin.app, {
			title: "Delete Seasonal Note",
			message: "Delete seasonal note for Summer 1403?",
		});
		expect(trashFile).toHaveBeenCalledWith(file);
		expect(plugin.refreshViews).toHaveBeenCalledTimes(1);
	});

	it("finds and deletes a yearly note after confirmation", async () => {
		const { service, plugin, addFile, trashFile } = createHarness();
		const file = addFile("Yearly/1403.md");
		confirmModalMock.mockResolvedValue(true);

		expect(service.getYearlyNoteFile(1403)).toBe(file);

		await service.deleteYearlyNote(1403);

		expect(confirmModalMock).toHaveBeenCalledWith(plugin.app, {
			title: "Delete Yearly Note",
			message: "Delete yearly note for 1403?",
		});
		expect(trashFile).toHaveBeenCalledWith(file);
		expect(plugin.refreshViews).toHaveBeenCalledTimes(1);
	});

	it("does not trash note when confirmation is cancelled", async () => {
		const { service, plugin, addFile, trashFile } = createHarness();
		addFile("Yearly/1403.md");
		confirmModalMock.mockResolvedValue(false);

		await service.deleteYearlyNote(1403);

		expect(trashFile).not.toHaveBeenCalled();
		expect(plugin.refreshViews).not.toHaveBeenCalled();
	});

	it("shows an error notice if trashing fails", async () => {
		const { service, plugin, addFile, trashFile } = createHarness({ askForDeleteNote: false });
		addFile("Monthly/1403-01.md");
		trashFile.mockRejectedValueOnce(new Error("boom"));

		await service.deleteMonthlyNote(1403, 1);

		expect(noticeMock).toHaveBeenCalledWith("Failed to delete the monthly note.");
		expect(plugin.refreshViews).not.toHaveBeenCalled();
	});
});

describe("seasonal note context menu", () => {
	it("adds Delete only for an existing seasonal note", () => {
		setLocal("en");
		const handlers = new Map<string, (event: MouseEvent) => void>();
		const seasonEls: Array<{ addClass: ReturnType<typeof vi.fn> }> = [];
		const seasonsRow = {
			createDiv: () => {
				const index = seasonEls.length;
				const seasonEl = {
					addClass: vi.fn(),
					addEventListener: (type: string, handler: (event: MouseEvent) => void) => {
						handlers.set(`${index}:${type}`, handler);
					},
				};
				seasonEls.push(seasonEl);
				return seasonEl;
			},
		};
		const notesService = {
			getSeasonsWithNotes: () => [2],
			getSeasonalNoteFile: (_year: number, season: number) => (season === 2 ? {} : null),
			openOrCreateSeasonalNote: vi.fn(),
			deleteSeasonalNote: vi.fn(),
		};
		const renderer = new CalendarBodyRender(
			{ getJState: () => ({ jYearState: 1403, jMonthState: 1 }) } as never,
			notesService as never,
			DEFAULT_SETTING,
			() => {},
			{} as never,
		);

		renderer.renderSeasonalNotesRow({ createDiv: () => seasonsRow } as never, "en");
		handlers.get("0:contextmenu")?.({ preventDefault: vi.fn(), stopPropagation: vi.fn() } as never);
		expect(menuItems.every((item) => item.icon !== "trash")).toBe(true);

		menuItems.length = 0;
		handlers.get("1:contextmenu")?.({ preventDefault: vi.fn(), stopPropagation: vi.fn() } as never);

		expect(menuItems.at(-1)).toMatchObject({ title: "Delete", icon: "trash", warning: true });
		menuItems.at(-1)?.onClick?.();
		expect(notesService.deleteSeasonalNote).toHaveBeenCalledWith(1403, 2);
	});
});

describe("openNoteContextMenu", () => {
	it("marks the delete menu item as warning (red) with trash icon when onDelete is provided", () => {
		const onOpen = vi.fn();
		const onDelete = vi.fn();
		const event = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
		} as unknown as MouseEvent;

		setLocal("en");
		openNoteContextMenu(event, onOpen, onDelete);

		expect(separatorCalls).toHaveBeenCalledTimes(1);
		const deleteItem = menuItems.at(-1);
		expect(deleteItem).toMatchObject({
			title: "Delete",
			icon: "trash",
			warning: true,
		});

		deleteItem?.onClick?.();
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("does not add a delete menu item when onDelete is omitted", () => {
		const event = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
		} as unknown as MouseEvent;

		openNoteContextMenu(event, vi.fn());

		expect(separatorCalls).not.toHaveBeenCalled();
		expect(menuItems.every((item) => item.icon !== "trash")).toBe(true);
	});
});
