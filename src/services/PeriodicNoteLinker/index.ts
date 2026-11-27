import type { FrontMatterCache, TAbstractFile } from "obsidian";
import { TFile } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TPeriodicNoteInfo } from "src/types";
import { DatePatternFormatError } from "src/utils/dateEngine";
import {
	calendarDaysBetween,
	dateToEndDayOfSeasonCalendarDate,
	getDaysInJalaliYear,
	jalaliMonthLength,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";

const AUTO = "pc-auto-link";
const LINKS = "pc-links";
const skipWrite = Symbol("skip frontmatter write");
const children = {
	weekly: ["daily"],
	monthly: ["daily", "weekly"],
	seasonal: ["daily", "weekly", "monthly"],
	yearly: ["daily", "weekly", "monthly", "seasonal"],
} as const;

type Period = {
	info: TPeriodicNoteInfo;
	firstDay: number;
	length: number;
};

function dayNumber(jy: number, jm: number, jd: number): number {
	const date = jalaliToCalendarDate(jy, jm, jd);
	return date.calendar.toJulianDay(date);
}

function periodOf(info: TPeriodicNoteInfo | null): Period | null {
	if (!info) return null;
	switch (info.type) {
		case "daily":
			return { info, firstDay: dayNumber(info.jy, info.jm, info.jd), length: 1 };
		case "weekly": {
			const { jy, jm, jd } = info.anchor;
			return { info, firstDay: dayNumber(jy, jm, jd), length: 7 };
		}
		case "monthly":
			return {
				info,
				firstDay: dayNumber(info.jy, info.jm, 1),
				length: jalaliMonthLength(info.jy, info.jm),
			};
		case "seasonal": {
			const firstMonth = 3 * (info.seasonNumber - 1) + 1;
			const start = jalaliToCalendarDate(info.jy, firstMonth, 1);
			const end = dateToEndDayOfSeasonCalendarDate(start);
			return {
				info,
				firstDay: start.calendar.toJulianDay(start),
				length: calendarDaysBetween(start, end) + 1,
			};
		}
		case "yearly":
			return { info, firstDay: dayNumber(info.jy, 1, 1), length: getDaysInJalaliYear(info.jy) };
	}
}

function hasLinkProperties(fm?: FrontMatterCache): fm is FrontMatterCache {
	return !!fm && typeof fm === "object" && (AUTO in fm || LINKS in fm);
}

function sameLinks(current: unknown, desired: string[] | undefined): boolean {
	if (!desired) return current === undefined;
	return (
		Array.isArray(current) &&
		current.length === desired.length &&
		desired.every((link, index) => link === current[index])
	);
}

export default class PeriodicNoteLinker {
	private periods = new WeakMap<TFile, Period | null>();
	private byFirstDay?: Map<number, TFile[]>;
	private pending = new Set<TFile>();
	private allPending = false;
	private awaitingResolution = false;
	private running = false;
	private stopped = false;
	private timer?: ReturnType<typeof setTimeout>;

	constructor(private readonly plugin: PersianCalendarPlugin) {}

	// A non-periodic namesake can also change Obsidian's shortest unique link path.
	filesChanged(file?: TAbstractFile) {
		if (file instanceof TFile) this.periods.delete(file);
		else this.periods = new WeakMap();
		this.byFirstDay = undefined;
		this.awaitingResolution = true;
		this.allPending = true;
		this.schedule();
	}

	cacheResolved() {
		// File events can precede the cache that Obsidian uses to disambiguate links.
		if (!this.awaitingResolution) return;
		this.awaitingResolution = false;
		this.allPending = true;
		this.schedule();
	}

	metadataChanged(file: TFile, frontmatter?: FrontMatterCache) {
		if (!hasLinkProperties(frontmatter)) return;
		this.pending.add(file);
		this.schedule();
	}

	stop() {
		this.stopped = true;
		clearTimeout(this.timer);
	}

	private schedule() {
		if (this.stopped || this.timer !== undefined || this.running) return;
		this.timer = setTimeout(() => void this.flush(), 100);
	}

	private async flush() {
		this.timer = undefined;
		this.running = true;
		const files = this.allPending ? this.plugin.app.vault.getMarkdownFiles() : this.pending;
		this.pending = new Set();
		this.allPending = false;
		try {
			for (const file of files) {
				if (this.stopped) break;
				if (!file.path.endsWith(".md")) continue;
				const fm = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
				if (!hasLinkProperties(fm)) continue;
				try {
					await this.sync(file, fm);
				} catch (error) {
					if (error !== skipWrite) {
						reportError(
							new Error(`Persian Calendar could not synchronize links for ${file.path}`, {
								cause: error,
							}),
						);
					}
				}
			}
		} finally {
			this.running = false;
			if (this.allPending || this.pending.size) this.schedule();
		}
	}

	private period(file: TFile): Period | null {
		const cached = this.periods.get(file);
		if (cached !== undefined) return cached;
		let period: Period | null = null;
		try {
			period = periodOf(this.plugin.noteService.getPeriodicNoteInfo(file));
		} catch (error) {
			// A path token unavailable for this note type must not block other periods.
			if (!(error instanceof DatePatternFormatError)) throw error;
		}
		this.periods.set(file, period);
		return period;
	}

	private childrenByFirstDay(): Map<number, TFile[]> {
		if (this.byFirstDay) return this.byFirstDay;
		const days = new Map<number, TFile[]>();
		for (const note of this.plugin.app.vault.getMarkdownFiles()) {
			const period = this.period(note);
			if (!period || period.info.type === "yearly") continue;
			if (period.info.type === "weekly") {
				const { weekYear, weekNumber } = period.info;
				if (this.plugin.noteService.getWeeklyNoteFile(weekYear, weekNumber) !== note) continue;
			}
			const bucket = days.get(period.firstDay);
			if (bucket) bucket.push(note);
			else days.set(period.firstDay, [note]);
		}
		for (const notes of days.values()) notes.sort((a, b) => a.path.localeCompare(b.path));
		this.byFirstDay = days;
		return days;
	}

	private linksFor(file: TFile, selection: unknown): string[] | undefined {
		if (!Array.isArray(selection)) return;
		const parent = this.period(file);
		if (!parent || parent.info.type === "daily") return;
		const types = children[parent.info.type].filter((type) => selection.includes(type));
		const links: string[] = [];
		if (!types.length) return links;
		const days = this.childrenByFirstDay();
		// Only a weekly child can start before its parent and still overlap it.
		for (let day = parent.firstDay - 6; day < parent.firstDay + parent.length; day++) {
			for (const note of days.get(day) ?? []) {
				const child = this.period(note);
				if (!child || day + child.length <= parent.firstDay) continue;
				if (!types.some((type) => type === child.info.type)) continue;
				const path = this.plugin.app.metadataCache.fileToLinktext(note, file.path, true);
				links.push(`[[${path}]]`);
			}
		}
		return links;
	}

	private async sync(file: TFile, fm: FrontMatterCache) {
		const desired = this.linksFor(file, fm[AUTO]);
		if (sameLinks(fm[LINKS], desired)) return;
		const path = file.path;
		await this.plugin.app.fileManager.processFrontMatter(file, (live) => {
			if (
				this.stopped ||
				file.path !== path ||
				this.plugin.app.vault.getFileByPath(path) !== file
			) {
				throw skipWrite;
			}
			// A user may have changed the selection while the atomic write was waiting.
			const links = this.linksFor(file, live[AUTO]);
			if (sameLinks(live[LINKS], links)) throw skipWrite;
			if (links === undefined) delete live[LINKS];
			else live[LINKS] = links;
		});
	}
}
