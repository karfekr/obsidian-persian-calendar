import type { App } from "obsidian";
import { MarkdownView, TFile, TFolder } from "obsidian";
import { createNoteModal, Notice } from "src/components";
import { t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type {
	TDateEngineContext,
	TJalali,
	TNoteNavTarget,
	TOpenNoteMode,
	TPeriodicNoteInfo,
} from "src/types";
import { parsePattern } from "src/utils/dateEngine";
import {
	checkValidJalali,
	dateToJalali,
	getWeekStartCalculator,
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	todayTehran,
} from "src/utils/dateUtils";

export default class NoteService {
	private readonly pathBuilder: NotePathBuilder;

	constructor(
		private readonly app: App,
		private readonly plugin: PersianCalendarPlugin,
	) {
		this.pathBuilder = new NotePathBuilder(plugin);
	}

	public getDailyNoteDate(file: TFile): TJalali | null {
		const detectionPattern = this.pathBuilder.buildDetectionPattern();
		if (!detectionPattern) return null;

		const parsed = parsePattern(detectionPattern, file.path);
		if (!parsed) return null;

		const date = this.resolveJalaliFromContext(parsed);
		if (!date || !checkValidJalali(date.jy, date.jm, date.jd)) return null;

		const { filePath } = this.pathBuilder.buildDailyNotePath(date.jy, date.jm, date.jd);
		if (filePath !== file.path) return null;

		return date;
	}

	public getPeriodicNoteInfo(file: TFile): TPeriodicNoteInfo | null {
		const daily = this.getDailyNoteDate(file);
		if (daily) {
			return { type: "daily", ...daily };
		}

		const weekly = this.getWeeklyNoteInfo(file);
		if (weekly) return weekly;

		const monthly = this.getMonthlyNoteInfo(file);
		if (monthly) return monthly;

		return this.getSeasonalNoteInfo(file) ?? this.getYearlyNoteInfo(file);
	}

	private getWeeklyNoteInfo(file: TFile): Extract<TPeriodicNoteInfo, { type: "weekly" }> | null {
		const match = file.basename.match(/^(\d{4})-W(\d{1,2})$/);
		if (!match) return null;

		const weekYear = Number(match[1]);
		const weekNumber = Number(match[2]);
		if (weekNumber < 1 || weekNumber > 53) return null;

		const { filePath, fileName } = this.pathBuilder.buildWeeklyNotePath(weekYear, weekNumber);
		const legacyPath =
			weekNumber < 10
				? `${filePath.slice(0, -fileName.length)}${weekYear}-W${weekNumber}.md`
				: null;

		if (file.path !== filePath && file.path !== legacyPath) return null;

		const start = getWeekStartCalculator(this.plugin.setting.weekCalculation).getStartOfWeek(
			weekYear,
			weekNumber,
		);

		return {
			type: "weekly",
			weekYear,
			weekNumber,
			anchor: { jy: start.jy, jm: start.jm, jd: start.jd },
		};
	}

	private getMonthlyNoteInfo(file: TFile): Extract<TPeriodicNoteInfo, { type: "monthly" }> | null {
		const match = file.basename.match(/^(\d{4})-(\d{2})$/);
		if (!match) return null;

		const rawYear = Number(match[1]);
		const rawMonth = Number(match[2]);
		if (rawMonth < 1 || rawMonth > 12) return null;

		const isGregorian = this.plugin.setting.monthlyNoteNaming === "gregorian";
		const jm = isGregorian ? (rawMonth >= 3 ? rawMonth - 2 : rawMonth + 10) : rawMonth;
		const jy = isGregorian ? (rawMonth >= 3 ? rawYear - 621 : rawYear - 622) : rawYear;

		const { filePath } = this.pathBuilder.buildMonthlyNotePath(jy, jm);
		if (file.path !== filePath) return null;

		return { type: "monthly", jy, jm };
	}

	private getSeasonalNoteInfo(
		file: TFile,
	): Extract<TPeriodicNoteInfo, { type: "seasonal" }> | null {
		const match = file.basename.match(/^(\d{4})-S([1-4])$/);
		if (!match) return null;

		const jy = Number(match[1]);
		const seasonNumber = Number(match[2]);
		const { filePath } = this.pathBuilder.buildSeasonalNotePath(jy, seasonNumber);
		return file.path === filePath ? { type: "seasonal", jy, seasonNumber } : null;
	}

	private getYearlyNoteInfo(file: TFile): Extract<TPeriodicNoteInfo, { type: "yearly" }> | null {
		const match = file.basename.match(/^(\d{4})$/);
		if (!match) return null;

		const rawYear = Number(match[1]);
		const jy = this.plugin.setting.yearlyNoteNaming === "gregorian" ? rawYear - 621 : rawYear;

		const { filePath } = this.pathBuilder.buildYearlyNotePath(jy);
		if (file.path !== filePath) return null;

		return { type: "yearly", jy };
	}

	public resolveJalaliFromContext(ctx: TDateEngineContext): TJalali | null {
		if (ctx.jy !== undefined && ctx.jm !== undefined && ctx.jd !== undefined) {
			return { jy: ctx.jy, jm: ctx.jm, jd: ctx.jd };
		}
		if (ctx.gy !== undefined && ctx.gm !== undefined && ctx.gd !== undefined) {
			return gregorianToJalali(ctx.gy, ctx.gm, ctx.gd);
		}

		const hasAnyField =
			ctx.jy !== undefined ||
			ctx.jm !== undefined ||
			ctx.jd !== undefined ||
			ctx.gy !== undefined ||
			ctx.gm !== undefined ||
			ctx.gd !== undefined;
		if (!hasAnyField) return null;

		return this.searchMatchingDate(ctx);
	}

	private searchMatchingDate(ctx: TDateEngineContext): TJalali | null {
		const today = dateToJalali(todayTehran());

		const anchorJy = ctx.jy ?? (ctx.gy !== undefined ? ctx.gy - 621 : today.jy);

		const YEAR_RANGE = 2;
		let match: TJalali | null = null;
		let matchCount = 0;

		for (let jy = anchorJy - YEAR_RANGE; jy <= anchorJy + YEAR_RANGE; jy++) {
			for (let jm = 1; jm <= 12; jm++) {
				if (ctx.jm !== undefined && ctx.jm !== jm) continue;

				const daysInMonth = jalaliMonthLength(jy, jm);
				for (let jd = 1; jd <= daysInMonth; jd++) {
					if (ctx.jd !== undefined && ctx.jd !== jd) continue;

					const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
					if (ctx.gy !== undefined && ctx.gy !== gy) continue;
					if (ctx.gm !== undefined && ctx.gm !== gm) continue;
					if (ctx.gd !== undefined && ctx.gd !== gd) continue;

					matchCount++;
					if (matchCount > 1) return null;
					match = { jy, jm, jd };
				}
			}
		}

		return matchCount === 1 ? match : null;
	}

	private async openNoteInWorkspace(noteFile: TFile, openMode: TOpenNoteMode = "current") {
		if (openMode === "current") {
			const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");

			const existingLeaf = markdownLeaves.find(
				(leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile,
			);

			if (existingLeaf) {
				this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
				return;
			}

			const leaf =
				this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf ??
				this.app.workspace.getMostRecentLeaf();

			if (leaf) {
				await leaf.openFile(noteFile, { active: true });
			}
			return;
		}

		const targetLeaf = this.getTargetLeafForOpenMode(openMode);
		if (targetLeaf) {
			await targetLeaf.openFile(noteFile, { active: true });
			this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
		}
	}

	private getTargetLeafForOpenMode(openMode: Exclude<TOpenNoteMode, "current">) {
		if (openMode === "tab") {
			return this.app.workspace.getLeaf("tab");
		}

		const direction = openMode === "split-horizontal" ? "horizontal" : "vertical";
		const baseLeaf =
			this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf ??
			this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);

		if (baseLeaf) {
			return this.app.workspace.createLeafBySplit(baseLeaf, direction);
		}

		return this.app.workspace.getLeaf("split", direction);
	}

	private async applyTemplateIfConfigured(
		file: TFile,
		noteType: "daily" | "weekly" | "monthly" | "seasonal" | "yearly",
	) {
		const templatePath = this.getTemplatePathForNoteType(noteType);

		if (!templatePath || templatePath.trim() === "") {
			return;
		}

		try {
			const templateContent = await this.plugin.placeholder.getTemplateContent(templatePath, file);

			if (templateContent !== null) {
				await this.app.vault.modify(file, templateContent);
			}
		} catch (error) {
			Notice(`Error applying template for ${noteType}: ${String(error)}`);
		}
	}

	private getTemplatePathForNoteType(
		noteType: "daily" | "weekly" | "monthly" | "seasonal" | "yearly",
	): string {
		switch (noteType) {
			case "daily":
				return this.plugin.setting.dailyTemplatePath || "";
			case "weekly":
				return this.plugin.setting.weeklyTemplatePath || "";
			case "monthly":
				return this.plugin.setting.monthlyTemplatePath || "";
			case "seasonal":
				return this.plugin.setting.seasonalTemplatePath || "";
			default:
				return this.plugin.setting.yearlyTemplatePath || "";
		}
	}

	private async ensureFolderExistsForPath(filePath: string): Promise<boolean> {
		const folderPath = filePath.substring(0, filePath.lastIndexOf("/"));

		if (!folderPath) return true;

		let currentPath = "";

		for (const segment of folderPath.split("/")) {
			currentPath = currentPath ? `${currentPath}/${segment}` : segment;

			const existing = this.app.vault.getAbstractFileByPath(currentPath);

			if (existing instanceof TFolder) {
				continue;
			}

			if (existing instanceof TFile) {
				Notice(`Cannot create folder because a file already exists:\n${currentPath}`);
				return false;
			}

			await this.app.vault.createFolder(currentPath);
		}

		return true;
	}

	private async openOrCreateNoteWithConfirm(options: {
		filePath: string;
		confirmTitle: string;
		confirmMessage: string;
		noteType?: "daily" | "weekly" | "monthly" | "seasonal" | "yearly";
		openMode?: TOpenNoteMode;
	}) {
		const { filePath, confirmTitle, confirmMessage, noteType, openMode = "current" } = options;

		const existing = this.app.vault.getAbstractFileByPath(filePath);

		if (existing instanceof TFile) {
			await this.openNoteInWorkspace(existing, openMode);
			return;
		}

		if (existing instanceof TFolder) {
			Notice(`Cannot create note because a folder already exists:\n${filePath}`);
			return;
		}

		if (this.plugin.setting.askForCreateNote) {
			const confirmed = await createNoteModal(this.app, {
				title: confirmTitle,
				message: confirmMessage,
			});

			if (!confirmed) {
				return;
			}
		}

		if (!(await this.ensureFolderExistsForPath(filePath))) {
			return;
		}

		let createdFile: TFile;

		try {
			createdFile = await this.app.vault.create(filePath, "");
		} catch {
			const retry = this.app.vault.getAbstractFileByPath(filePath);

			if (!(retry instanceof TFile)) {
				Notice(`Failed to create note:\n${filePath}`);
				return;
			}

			createdFile = retry;
		}

		if (noteType) {
			try {
				await this.applyTemplateIfConfigured(createdFile, noteType);
			} catch (error) {
				Notice(
					`The note was created successfully, but applying the template failed.${
						error instanceof Error ? `\n${error.message}` : ""
					}`,
				);
			}
		}

		await this.openNoteInWorkspace(createdFile, openMode);
		this.plugin.refreshViews();
	}

	public getWeeksWithNotes(jy: number): number[] {
		const result: number[] = [];

		for (let weekNumber = 1; weekNumber <= 53; weekNumber++) {
			if (this.getWeeklyNoteFile(jy, weekNumber)) {
				result.push(weekNumber);
			}
		}

		return result;
	}

	public getWeeklyNoteFile(jy: number, weekNumber: number): TFile | null {
		const { filePath, fileName } = this.pathBuilder.buildWeeklyNotePath(jy, weekNumber);
		const file = this.getNoteFileAtPath(filePath);
		if (file || weekNumber >= 10) return file;

		// Reuse older unpadded filenames without renaming notes.
		const legacyPath = `${filePath.slice(0, -fileName.length)}${jy}-W${weekNumber}.md`;
		return this.getNoteFileAtPath(legacyPath);
	}

	public getSeasonsWithNotes(jy: number): number[] {
		const result: number[] = [];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			if (this.getPeriodicNoteFile({ mode: "seasonal", jy, seasonNumber })) {
				result.push(seasonNumber);
			}
		}

		return result;
	}

	public getDailyNoteFile(jy: number, jm: number, jd: number): TFile | null {
		const { filePath } = this.pathBuilder.buildDailyNotePath(jy, jm, jd);
		return this.getNoteFileAtPath(filePath);
	}

	public getPeriodicNoteFile(target: TNoteNavTarget): TFile | null {
		switch (target.mode) {
			case "daily":
				return this.getDailyNoteFile(target.jy, target.jm, target.jd);
			case "weekly":
				return this.getWeeklyNoteFile(target.weekYear, target.weekNumber);
			case "monthly":
				return this.getNoteFileAtPath(
					this.pathBuilder.buildMonthlyNotePath(target.jy, target.jm).filePath,
				);
			case "seasonal":
				return this.getNoteFileAtPath(
					this.pathBuilder.buildSeasonalNotePath(target.jy, target.seasonNumber).filePath,
				);
			case "yearly":
				return this.getNoteFileAtPath(this.pathBuilder.buildYearlyNotePath(target.jy).filePath);
		}
	}

	private getNoteFileAtPath(filePath: string): TFile | null {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		return file instanceof TFile ? file : null;
	}

	public getMonthlyNoteFile(jy: number, jm: number): TFile | null {
		const { filePath } = this.pathBuilder.buildMonthlyNotePath(jy, jm);
		const file = this.app.vault.getAbstractFileByPath(filePath);
		return file instanceof TFile ? file : null;
	}

	public getSeasonalNoteFile(jy: number, seasonNumber: number): TFile | null {
		const { filePath } = this.pathBuilder.buildSeasonalNotePath(jy, seasonNumber);
		const file = this.app.vault.getAbstractFileByPath(filePath);
		return file instanceof TFile ? file : null;
	}

	public getYearlyNoteFile(jy: number): TFile | null {
		const { filePath } = this.pathBuilder.buildYearlyNotePath(jy);
		const file = this.app.vault.getAbstractFileByPath(filePath);
		return file instanceof TFile ? file : null;
	}

	private async deleteNoteWithConfirm(options: {
		file: TFile;
		confirmTitle: string;
		confirmMessage: string;
		errorNotice: string;
	}) {
		const { file, confirmTitle, confirmMessage, errorNotice } = options;

		if (this.plugin.setting.askForDeleteNote) {
			const confirmed = await createNoteModal(this.app, {
				title: confirmTitle,
				message: confirmMessage,
			});

			if (!confirmed) return;
		}

		try {
			await this.app.fileManager.trashFile(file);
			this.plugin.refreshViews();
		} catch {
			Notice(errorNotice);
		}
	}

	public async deleteDailyNote(jy: number, jm: number, jd: number) {
		const file = this.getDailyNoteFile(jy, jm, jd);
		if (!file) return;

		const { dateString } = this.pathBuilder.buildDailyNotePath(jy, jm, jd);
		await this.deleteNoteWithConfirm({
			file,
			confirmTitle: t("modal.deleteDailyNote.title"),
			confirmMessage: t("modal.deleteDailyNote.message").replace("{date}", dateString),
			errorNotice: t("notice.error.dailyNoteDeleteFailed"),
		});
	}

	public async deleteWeeklyNote(jy: number, weekNumber: number) {
		const file = this.getWeeklyNoteFile(jy, weekNumber);
		if (!file) return;

		const weekLabel = String(weekNumber).padStart(2, "0");
		await this.deleteNoteWithConfirm({
			file,
			confirmTitle: t("modal.deleteWeeklyNote.title"),
			confirmMessage: t("modal.deleteWeeklyNote.message")
				.replace("{week}", weekLabel)
				.replace("{year}", String(jy)),
			errorNotice: t("notice.error.weeklyNoteDeleteFailed"),
		});
	}

	public async deleteMonthlyNote(jy: number, jm: number) {
		const file = this.getMonthlyNoteFile(jy, jm);
		if (!file) return;

		const { jMonthName } = this.pathBuilder.buildMonthlyNotePath(
			jy,
			jm,
			this.plugin.setting.language,
		);
		await this.deleteNoteWithConfirm({
			file,
			confirmTitle: t("modal.deleteMonthlyNote.title"),
			confirmMessage: t("modal.deleteMonthlyNote.message")
				.replace("{month}", jMonthName)
				.replace("{year}", String(jy)),
			errorNotice: t("notice.error.monthlyNoteDeleteFailed"),
		});
	}

	public async deleteSeasonalNote(jy: number, seasonNumber: number) {
		const file = this.getSeasonalNoteFile(jy, seasonNumber);
		if (!file) return;

		const { seasonName } = this.pathBuilder.buildSeasonalNotePath(
			jy,
			seasonNumber,
			this.plugin.setting.language,
		);
		await this.deleteNoteWithConfirm({
			file,
			confirmTitle: t("modal.deleteSeasonalNote.title"),
			confirmMessage: t("modal.deleteSeasonalNote.message")
				.replace("{season}", seasonName)
				.replace("{year}", String(jy)),
			errorNotice: t("notice.error.seasonalNoteDeleteFailed"),
		});
	}

	public async deleteYearlyNote(jy: number) {
		const file = this.getYearlyNoteFile(jy);
		if (!file) return;

		await this.deleteNoteWithConfirm({
			file,
			confirmTitle: t("modal.deleteYearlyNote.title"),
			confirmMessage: t("modal.deleteYearlyNote.message").replace("{year}", String(jy)),
			errorNotice: t("notice.error.yearlyNoteDeleteFailed"),
		});
	}

	public getDaysWithNotes(jy: number, jm: number): number[] {
		const result: number[] = [];
		const daysInMonth = jalaliMonthLength(jy, jm);

		for (let jd = 1; jd <= daysInMonth; jd++) {
			const { filePath } = this.pathBuilder.buildDailyNotePath(jy, jm, jd);
			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (file instanceof TFile) {
				result.push(jd);
			}
		}

		return result;
	}

	public async openOrCreateDailyNote(
		jy: number,
		jm: number,
		jd: number,
		openMode: TOpenNoteMode = "current",
	) {
		const { filePath, dateString } = this.pathBuilder.buildDailyNotePath(jy, jm, jd);

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد روزنوشت جدید" : "Create New Daily Note";
		const confirmMessage =
			lang === "fa"
				? `روزنوشت \u202A${dateString}\u202C ایجاد شود؟`
				: `Create daily note for ${dateString}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "daily",
			openMode,
		});
	}

	public async openOrCreateWeeklyNote(
		jy: number,
		weekNumber: number,
		openMode: TOpenNoteMode = "current",
	) {
		const filePath =
			this.getWeeklyNoteFile(jy, weekNumber)?.path ??
			this.pathBuilder.buildWeeklyNotePath(jy, weekNumber).filePath;
		const weekLabel = String(weekNumber).padStart(2, "0");

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد هفته‌نوشت جدید" : "Create New Weekly Note";
		const confirmMessage =
			lang === "fa"
				? `هفته‌نوشت هفته‌ی ${weekLabel}ام سال ${jy} ایجاد شود؟`
				: `Create weekly note for week ${weekLabel} of ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "weekly",
			openMode,
		});
	}

	public async openOrCreateMonthlyNote(
		jy: number,
		jm: number,
		openMode: TOpenNoteMode = "current",
	) {
		const { filePath, jMonthName } = this.pathBuilder.buildMonthlyNotePath(jy, jm);

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد ماه‌نوشت جدید" : "Create New Monthly Note";
		const confirmMessage =
			lang === "fa"
				? `ماه‌نوشت ${jMonthName} ${jy} ایجاد شود؟`
				: `Create monthly note for ${jMonthName} ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "monthly",
			openMode,
		});
	}

	public async openOrCreateSeasonalNote(
		jy: number,
		seasonNumber: number,
		openMode: TOpenNoteMode = "current",
	) {
		const { filePath, seasonName } = this.pathBuilder.buildSeasonalNotePath(jy, seasonNumber);

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد فصل‌نوشت جدید" : "Create New Seasonal Note";
		const confirmMessage =
			lang === "fa"
				? `فصل‌نوشت ${seasonName} ${jy} ایجاد شود؟`
				: `Create seasonal note for ${seasonName} ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "seasonal",
			openMode,
		});
	}

	public async openOrCreateYearlyNote(jy: number, openMode: TOpenNoteMode = "current") {
		const { filePath } = this.pathBuilder.buildYearlyNotePath(jy);

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد سال‌نوشت جدید" : "Create New Yearly Note";
		const confirmMessage =
			lang === "fa" ? `سال‌نوشت ${jy} ایجاد شود؟` : `Create yearly note for ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "yearly",
			openMode,
		});
	}
}
