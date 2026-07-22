import type { App } from "obsidian";
import { MarkdownView, TFile, TFolder } from "obsidian";
import { createNoteModal, Notice } from "src/components";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type { TDateEngineContext, TJalali } from "src/types";
import { parsePattern } from "src/utils/dateEngine";
import { gregorianToJalali, jalaliMonthLength, jalaliToGregorian } from "src/utils/dateUtils";

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
		if (!date) return null;

		const { filePath } = this.pathBuilder.buildDailyNotePath(date.jy, date.jm, date.jd);
		if (filePath !== file.path) return null;

		return date;
	}

	private resolveJalaliFromContext(ctx: TDateEngineContext): TJalali | null {
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
		const today = gregorianToJalali(
			new Date().getFullYear(),
			new Date().getMonth() + 1,
			new Date().getDate(),
		);

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

	private async openNoteInWorkspace(noteFile: TFile) {
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
			Notice(`Error applying template for ${noteType}: ${error}`);
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
	}) {
		const { filePath, confirmTitle, confirmMessage, noteType } = options;

		const existing = this.app.vault.getAbstractFileByPath(filePath);

		if (existing instanceof TFile) {
			await this.openNoteInWorkspace(existing);
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

		await this.openNoteInWorkspace(createdFile);
		this.plugin.refreshViews();
	}

	public getWeeksWithNotes(jy: number): number[] {
		const result: number[] = [];

		for (let weekNumber = 1; weekNumber <= 53; weekNumber++) {
			const { filePath } = this.pathBuilder.buildWeeklyNotePath(jy, weekNumber);
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(weekNumber);
			}
		}

		return result;
	}

	public getSeasonsWithNotes(jy: number): number[] {
		const result: number[] = [];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const { filePath } = this.pathBuilder.buildSeasonalNotePath(jy, seasonNumber);
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(seasonNumber);
			}
		}

		return result;
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

	public async openOrCreateDailyNote(jy: number, jm: number, jd: number) {
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
		});
	}

	public async openOrCreateWeeklyNote(jy: number, weekNumber: number) {
		const { filePath } = this.pathBuilder.buildWeeklyNotePath(jy, weekNumber);

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد هفته‌نوشت جدید" : "Create New Weekly Note";
		const confirmMessage =
			lang === "fa"
				? `هفته‌نوشت هفته‌ی ${weekNumber}ام سال ${jy} ایجاد شود؟`
				: `Create weekly note for week ${weekNumber} of ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "weekly",
		});
	}

	public async openOrCreateMonthlyNote(jy: number, jm: number) {
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
		});
	}

	public async openOrCreateSeasonalNote(jy: number, seasonNumber: number) {
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
		});
	}

	public async openOrCreateYearlyNote(jy: number) {
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
		});
	}
}
