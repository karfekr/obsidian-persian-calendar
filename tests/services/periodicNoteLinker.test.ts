/// <reference types="node" />
import { EventEmitter } from "node:events";
import { TFile, TFolder } from "obsidian";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import EventManager from "src/services/EventManager";
import NoteService from "src/services/NoteService";
import PeriodicNoteLinker from "src/services/PeriodicNoteLinker";
import { createSettingChangeHandler } from "src/templates/Setting/settingEffects";
import type { TSetting, TWeekCalculationMode } from "src/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Properties = Record<string, unknown>;
const auto = (...types: string[]) => ({ "pc-auto-link": types });
const flush = () => vi.runAllTimersAsync();

function harness(settings: Partial<TSetting> = {}) {
	const files = new Map<string, TFile>();
	const properties = new Map<TFile, Properties>();
	const cached = new Map<TFile, Properties>();
	const vault = Object.assign(new EventEmitter(), {
		getFileByPath: (path: string) => files.get(path) ?? null,
		getAbstractFileByPath: (path: string) => files.get(path) ?? null,
		getMarkdownFiles: () => [...files.values()].filter((f) => f.path.endsWith(".md")),
	});
	const metadataCache = Object.assign(new EventEmitter(), {
		getFileCache: (file: TFile) => ({ frontmatter: cached.get(file) }),
		fileToLinktext: vi.fn((file: TFile, _sourcePath: string, omitExtension: boolean) => {
			expect(omitExtension).toBe(true);
			return [...files.values()].filter((other) => other.basename === file.basename).length > 1
				? file.path.slice(0, -3)
				: file.basename;
		}),
	});
	const index = (file: TFile) => {
		cached.set(file, structuredClone(properties.get(file) ?? {}));
		metadataCache.emit("changed", file, "", metadataCache.getFileCache(file));
	};
	const committed = vi.fn();
	const write = async (file: TFile, update: (fm: Properties) => void) => {
		const fm = properties.get(file);
		if (!fm) throw new Error("Missing file");
		update(fm);
		committed(file);
		index(file);
	};
	const processFrontMatter = vi.fn(write);
	const plugin = {
		setting: {
			...DEFAULT_SETTING,
			dailyNoteFormat: "jYYYY-jMM-jDD",
			dailyNotesPath: "D",
			weeklyNotesPath: "W",
			monthlyNotesPath: "M",
			yearlyNotesPath: "Y",
			...settings,
		},
		app: {
			vault,
			metadataCache,
			fileManager: { processFrontMatter },
			workspace: { onLayoutReady: vi.fn() },
		},
		vaultEventService: {
			isRelevantFile: () => false,
			moveSources: () => false,
			refresh: async () => {},
		},
		registerEvent: vi.fn(),
		refreshCalendarViews: vi.fn(),
		refreshViews: vi.fn(),
		saveSetting: vi.fn().mockResolvedValue(undefined),
	} as unknown as PersianCalendarPlugin;
	plugin.noteService = new NoteService(plugin.app, plugin);
	plugin.periodicLinks = new PeriodicNoteLinker(plugin);
	new EventManager(plugin).registerEvents();

	const add = (path: string, fm: Properties = {}) => {
		const file = Object.assign(new TFile(), {
			path,
			basename: path.split("/").pop()?.slice(0, -3),
		});
		files.set(path, file);
		properties.set(file, fm);
		cached.set(file, structuredClone(fm));
		return file;
	};
	const rename = (file: TFile, path: string) => {
		const old = file.path;
		files.delete(old);
		file.path = path;
		file.basename =
			path
				.split("/")
				.pop()
				?.replace(/\.[^.]+$/, "") ?? "";
		files.set(path, file);
		vault.emit("rename", file, old);
	};
	const remove = (file: TFile) => {
		files.delete(file.path);
		vault.emit("delete", file);
	};
	const links = (file: TFile) => properties.get(file)?.["pc-links"];
	return {
		add,
		rename,
		remove,
		links,
		index,
		cached,
		vault,
		properties,
		metadataCache,
		processFrontMatter,
		write,
		committed,
		plugin,
	};
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal("window", globalThis);
});
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("automatic periodic note links", () => {
	it.each<[TWeekCalculationMode, string]>([
		["jalali-first-day-of-year", "1404-W01"],
		["jalali-first-week-start", "1403-W52"],
		["gregorian-first-day-of-year", "2025-W12"],
		["gregorian-first-week-start", "2025-W11"],
	])("reconciles both sides of Nowruz using %s", async (weekCalculation, week) => {
		const h = harness({ weekCalculation });
		const parent = h.add(`W/${week}.md`, auto("daily", "monthly", "weekly", "daily"));
		const esfand = h.add("M/1403-12.md", auto("weekly", "daily"));
		const farvardin = h.add("M/1404-01.md", auto("weekly", "daily"));
		const oldYear = h.add("Y/1403.md", auto("seasonal", "monthly", "weekly", "daily"));
		const newYear = h.add("Y/1404.md", auto("seasonal", "monthly", "weekly", "daily"));
		for (const date of ["1404-01-02", "1403-12-30", "1403-12-24", "1404-01-01", "1403-12-25"]) {
			h.add(`D/${date}.md`);
		}
		h.add("D/1403-12-31.md"); // The last day of this leap year is Esfand 30.
		const winter = h.add("Journal/1403/Seasonal/1403-S4.md", auto("daily", "weekly", "monthly"));
		const spring = h.add("Journal/1404/Seasonal/1404-S1.md", auto("daily", "weekly", "monthly"));
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(parent)).toEqual(["[[1403-12-25]]", "[[1403-12-30]]", "[[1404-01-01]]"]);
		expect(h.links(esfand)).toEqual([
			"[[1403-12-24]]",
			"[[1403-12-25]]",
			`[[${week}]]`,
			"[[1403-12-30]]",
		]);
		expect(h.links(farvardin)).toEqual([`[[${week}]]`, "[[1404-01-01]]", "[[1404-01-02]]"]);
		expect(h.links(winter)).toEqual(["[[1403-12]]", ...(h.links(esfand) as string[])]);
		expect(h.links(spring)).toEqual([
			`[[${week}]]`,
			"[[1404-01-01]]",
			"[[1404-01]]",
			"[[1404-01-02]]",
		]);
		expect(h.links(oldYear)).toEqual(["[[1403-S4]]", ...(h.links(winter) as string[])]);
		expect(h.links(newYear)).toEqual([
			`[[${week}]]`,
			"[[1404-01-01]]",
			"[[1404-S1]]",
			"[[1404-01]]",
			"[[1404-01-02]]",
		]);
		expect(h.committed).toHaveBeenCalledTimes(7);
	});

	it("links a week across two seasons in the same year without mixing their days or months", async () => {
		const h = harness({
			weekCalculation: "gregorian-first-day-of-year",
			seasonalNotesPath: "Seasons/[jYYYY]/[jQQ]",
			showSeasonalNotes: false,
		});
		const summer = h.add(
			"Seasons/1404/02/1404-S2.md",
			auto("daily", "weekly", "monthly", "seasonal"),
		);
		const autumn = h.add("Seasons/1404/03/1404-S3.md", auto("daily", "weekly", "monthly"));
		const year = h.add("Y/1404.md", auto("seasonal"));
		h.add("M/1404-06.md");
		h.add("M/1404-07.md");
		h.add("D/1404-06-31.md");
		h.add("D/1404-07-01.md");
		h.add("W/2025-W39.md");
		h.add("W/2025-W40.md");
		h.add("Archive/1404-S4.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(summer)).toEqual(["[[1404-06]]", "[[2025-W39]]", "[[1404-06-31]]"]);
		expect(h.links(autumn)).toEqual([
			"[[2025-W39]]",
			"[[1404-07-01]]",
			"[[1404-07]]",
			"[[2025-W40]]",
		]);
		expect(h.links(year)).toEqual(["[[1404-S2]]", "[[1404-S3]]"]);
	});

	it("updates yearly links when seasonal notes or their configured path change", async () => {
		const h = harness({ seasonalNotesPath: "S" });
		const year = h.add("Y/1405.md", auto("seasonal"));
		const spring = h.add("S/1405-S1.md");
		h.vault.emit("create", spring);
		await flush();
		expect(h.links(year)).toEqual(["[[1405-S1]]"]);
		h.rename(spring, "New/1405-S1.md");
		await flush();
		expect(h.links(year)).toEqual([]);
		const change = createSettingChangeHandler(h.plugin, vi.fn());
		await change("seasonalNotesPath", "New");
		await flush();
		expect(h.links(year)).toEqual(["[[1405-S1]]"]);
		h.remove(spring);
		await flush();
		expect(h.links(year)).toEqual([]);
	});

	it("uses configured dynamic folders, Gregorian labels and source-relative disambiguation", async () => {
		const h = harness({
			dailyNotesPath: "Journal/[jYYYY]/Daily",
			dailyNoteFormat: "YYYY-MM-DD",
			monthlyNoteNaming: "gregorian",
			yearlyNoteNaming: "gregorian",
		});
		const parent = h.add("Y/2026.md", auto("daily", "monthly"));
		h.add("M/2026-11.md");
		h.add("Journal/1405/Daily/2026-11-24.md");
		const namesake = h.add("Archive/2026-11-24.md");
		h.add("Journal/1404/Daily/2026-11-23.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(parent)).toEqual(["[[2026-11]]", "[[Journal/1405/Daily/2026-11-24]]"]);
		expect(h.metadataCache.fileToLinktext).toHaveBeenCalledWith(
			expect.anything(),
			parent.path,
			true,
		);
		h.remove(namesake);
		await flush();
		expect(h.links(parent)).toEqual(["[[2026-11]]", "[[2026-11-24]]"]);
	});

	it("rechecks disambiguation once Obsidian finishes indexing a new namesake", async () => {
		const h = harness();
		const parent = h.add("M/1405-09.md", auto("daily"));
		const target = h.add("D/1405-09-01.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		h.metadataCache.fileToLinktext.mockReturnValueOnce(target.basename);
		h.vault.emit("create", h.add("Archive/1405-09-01.md"));
		await flush();
		expect(h.links(parent)).toEqual(["[[1405-09-01]]"]);
		h.metadataCache.emit("resolved");
		await flush();
		expect(h.links(parent)).toEqual([`[[${target.path.slice(0, -3)}]]`]);
		h.metadataCache.emit("resolved");
		await flush();
		expect(h.committed).toHaveBeenCalledTimes(2);
	});

	it("tracks creation, moves between periods, deletion, folder moves and late indexing", async () => {
		const h = harness();
		const azar = h.add("M/1405-09.md", auto("daily"));
		const dey = h.add("M/1405-10.md", auto("daily"));
		h.cached.delete(azar);
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(azar)).toBeUndefined();
		expect(h.links(dey)).toEqual([]);
		h.index(azar);
		const day = h.add("D/1405-09-05.md");
		h.vault.emit("create", day);
		await flush();
		expect(h.links(azar)).toEqual(["[[1405-09-05]]"]);
		h.rename(day, "D/1405-10-01.md");
		await flush();
		expect(h.links(azar)).toEqual([]);
		expect(h.links(dey)).toEqual(["[[1405-10-01]]"]);
		h.rename(dey, "Archive/1405-10.md");
		await flush();
		expect(h.links(dey)).toBeUndefined();
		h.rename(dey, "M/1405-10.md");
		await flush();
		expect(h.links(dey)).toEqual(["[[1405-10-01]]"]);
		h.remove(day);
		await flush();
		expect(h.links(dey)).toEqual([]);
		h.add("D/1405-10-02.md");
		h.vault.emit("rename", Object.assign(new TFolder(), { path: "D" }), "Old");
		await flush();
		expect(h.links(dey)).toEqual(["[[1405-10-02]]"]);
	});

	it("uses one weekly link per identity and falls back to the existing legacy filename", async () => {
		const h = harness();
		const month = h.add("M/1405-01.md", auto("weekly"));
		h.add("W/1405-W1.md");
		const canonical = h.add("W/1405-W01.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(month)).toEqual(["[[1405-W01]]"]);
		h.remove(canonical);
		await flush();
		expect(h.links(month)).toEqual(["[[1405-W1]]"]);
	});

	it("keeps valid relationships when a different note type has an unusable folder token", async () => {
		const h = harness({ monthlyNotesPath: "M/[ww]" });
		const year = h.add("Y/1405.md", auto("daily"));
		h.add("D/1405-09-01.md");
		h.add("M/01/1405-01.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.links(year)).toEqual(["[[1405-09-01]]"]);
	});

	it("updates only the managed property, handles opt-out offline and ignores feedback", async () => {
		const h = harness();
		const extra = { aliases: ["آذر"], custom: { priority: 2 } };
		const fm: Properties = {
			...extra,
			...auto("daily", "daily"),
			"pc-links": ["[[old]]", "[[old]]"],
		};
		const parent = h.add("M/1405-09.md", fm);
		const orphan = h.add("Y/1404.md", { ...extra, "pc-links": ["[[stale]]"] });
		const day = h.add("D/1405-09-01.md", auto("monthly"));
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.properties.get(orphan)).toEqual(extra);
		expect(h.links(parent)).toEqual(["[[1405-09-01]]"]);
		expect(h.links(day)).toBeUndefined();
		h.index(parent);
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.processFrontMatter).toHaveBeenCalledTimes(2);
		fm["pc-auto-link"] = ["weekly", "yearly", null, "unknown"];
		h.index(parent);
		await flush();
		expect(h.links(parent)).toEqual([]);
		delete fm["pc-auto-link"];
		h.index(parent);
		await flush();
		expect(fm).toEqual(extra);
		h.vault.emit("create", h.add("D/1405-09-02.md"));
		await flush();
		expect(h.processFrontMatter).toHaveBeenCalledTimes(4);
	});

	it("handles malformed selections and repairs manual edits to the managed list", async () => {
		const h = harness();
		const fm: Properties = { "pc-auto-link": "daily", "pc-links": "[[stale]]" };
		const parent = h.add("M/1405-09.md", fm);
		h.add("D/1405-09-01.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(fm).toEqual({ "pc-auto-link": "daily" });
		fm["pc-auto-link"] = [];
		h.index(parent);
		await flush();
		expect(h.links(parent)).toEqual([]);
		fm["pc-auto-link"] = ["daily"];
		h.index(parent);
		await flush();
		fm["pc-links"] = ["[[wrong]]", "[[wrong]]"];
		h.index(parent);
		await flush();
		expect(h.links(parent)).toEqual(["[[1405-09-01]]"]);
	});

	it("honors live opt-outs and skips disk writes when the metadata cache lags", async () => {
		const h = harness();
		const live: Properties = auto("daily");
		h.add("M/1405-09.md", live);
		live["pc-links"] = [];
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(h.committed).not.toHaveBeenCalled();
		h.vault.emit("create", h.add("D/1405-09-01.md"));
		delete live["pc-auto-link"];
		await flush();
		expect(live).toEqual({});
		expect(h.committed).toHaveBeenCalledOnce();
	});

	it("recovers from one failed write and rechecks changes arriving during another write", async () => {
		const h = harness();
		const one = h.add("M/1405-01.md", auto("daily"));
		const two = h.add("M/1405-02.md", auto("daily"));
		const error = vi.fn();
		vi.stubGlobal("reportError", error);
		h.processFrontMatter.mockRejectedValueOnce(new Error("write failed"));
		h.processFrontMatter.mockImplementationOnce(async (file, update) => {
			await h.write(file, update);
			h.vault.emit("create", h.add("D/1405-02-03.md"));
		});
		h.plugin.periodicLinks.filesChanged();
		await flush();
		expect(error).toHaveBeenCalledOnce();
		expect(h.links(one)).toEqual([]);
		expect(h.links(two)).toEqual(["[[1405-02-03]]"]);
	});

	it("follows updated note paths and cancels queued work on unload", async () => {
		const h = harness();
		const parent = h.add("Y/1405.md", auto("daily"));
		h.add("Other/1405-09-03.md");
		h.plugin.periodicLinks.filesChanged();
		await flush();
		const change = createSettingChangeHandler(h.plugin, vi.fn());
		await change("dailyNotesPath", "Other");
		await flush();
		expect(h.links(parent)).toEqual(["[[1405-09-03]]"]);
		h.remove(parent);
		const another = h.add("Y/1404.md", auto("daily"));
		h.vault.emit("create", another);
		h.plugin.periodicLinks.stop();
		await flush();
		expect(h.links(another)).toBeUndefined();
	});
});
