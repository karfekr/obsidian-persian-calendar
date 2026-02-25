import { App, TFile, MarkdownView } from "obsidian";
import type { TLocal, TPathTokenContext } from "src/types";
import { jalaliToGregorian, jalaliMonthLength, jalaliToSeason } from "src/utils/dateUtils";
import { createNoteModal } from "src/components/ConfirmModal";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";

export default class NoteService {
	constructor(
		private readonly app: App,
		private readonly plugin: PersianCalendarPlugin,
	) {}

	private normalizeFolderPath(path?: string | null) {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	private resolvePathTokens(path: string, ctx?: TPathTokenContext, local: TLocal = "fa") {
		if (!ctx) return path;

		let result = path;
		const { jy, jm } = ctx;

		if (jy != null) {
			result = result.replace(/jYYYY/g, String(jy));
		}

		if (jm != null) {
			const monthName = JALALI_MONTHS_NAME[local][jm];

			result = result
				.replace(/jMMMM/g, monthName)
				.replace(/jMM/g, jm.toString().padStart(2, "0"))
				.replace(/jM/g, jm.toString());
		}

		let { season } = ctx;
		if (season == null && jm != null) {
			season = jalaliToSeason(jm);
		}

		if (season != null) {
			const seasonName = SEASONS_NAME["fa"][season];

			result = result
				.replace(/jQQQQ/g, seasonName)
				.replace(/jQQ/g, season.toString().padStart(2, "0"))
				.replace(/jQ/g, season.toString());
		}

		return result;
	}

	private buildNotePath(
		basePath: string | undefined,
		fileName: string,
		tokenContext?: TPathTokenContext,
		local: TLocal = "fa",
	) {
		const normalized = this.normalizeFolderPath(basePath);
		const resolved = this.resolvePathTokens(normalized, tokenContext, local);

		return resolved ? `${resolved}/${fileName}` : fileName;
	}

	private async ensureFolderExistsForPath(filePath: string) {
		const parts = filePath.split("/");
		parts.pop();

		const folderPath = parts.join("/");
		if (!folderPath) return;

		let currentPath = "";
		for (const part of parts) {
			if (!part) continue;

			currentPath = currentPath ? `${currentPath}/${part}` : part;

			const existing = this.app.vault.getAbstractFileByPath(currentPath);
			if (!existing) {
				await this.app.vault.createFolder(currentPath);
			}
		}
	}

	private async openNoteInWorkspace(noteFile: TFile) {
		const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");

		const existingLeaf = markdownLeaves.find(
			(leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile,
		);

		if (existingLeaf) {
			this.app.workspace.setActiveLeaf(existingLeaf);
			return;
		}

		await this.app.workspace.openLinkText(noteFile.path, "", false);
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
			console.error(`Error applying template for ${noteType} note:`, error);
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

	private async openOrCreateNoteWithConfirm(options: {
		filePath: string;
		confirmTitle: string;
		confirmMessage: string;
		noteType?: "daily" | "weekly" | "monthly" | "seasonal" | "yearly";
	}) {
		const { filePath, confirmTitle, confirmMessage, noteType } = options;

		try {
			let noteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (noteFile instanceof TFile) {
				await this.openNoteInWorkspace(noteFile);
				return;
			}

			if (this.plugin.setting.askForCreateNote) {
				const shouldCreate = await createNoteModal(this.app, {
					title: confirmTitle,
					message: confirmMessage,
				});

				if (!shouldCreate) {
					return;
				}
			}

			await this.ensureFolderExistsForPath(filePath);

			const createdFile = await this.app.vault.create(filePath, "");

			if (createdFile instanceof TFile) {
				if (noteType) {
					await this.applyTemplateIfConfigured(createdFile, noteType);
				}

				await this.openNoteInWorkspace(createdFile);
			}
		} catch (error) {
			console.error("Error creating note:", error);
		}
	}

	public async getWeeksWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const result: number[] = [];

		for (let weekNumber = 1; weekNumber <= 53; weekNumber++) {
			const fileName = `${jy}-W${weekNumber}.md`;
			const filePath = this.buildNotePath(notesLocation, fileName, { jy });

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(weekNumber);
			}
		}

		return result;
	}

	public async getSeasonsWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const result: number[] = [];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const fileName = `${jy}-S${seasonNumber}.md`;
			const filePath = this.buildNotePath(notesLocation, fileName, {
				jy,
				season: seasonNumber,
			});

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(seasonNumber);
			}
		}

		return result;
	}

	public async getDaysWithNotes(jy: number, jm: number): Promise<number[]> {
		const notesLocation = this.plugin.setting.dailyNotesPath;
		const result: number[] = [];
		const daysInMonth = jalaliMonthLength(jy, jm);

		for (let jd = 1; jd <= daysInMonth!; jd++) {
			let fileName: string;

			if (this.plugin.setting.dateFormat === "gregorian") {
				const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
				fileName = `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}.md`;
			} else {
				fileName = `${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}.md`;
			}

			const filePath = this.buildNotePath(notesLocation, fileName, {
				jy,
				jm,
			});

			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (file instanceof TFile) {
				result.push(jd);
			}
		}

		return result;
	}

	public async openOrCreateDailyNote(jy: number, jm: number, jd: number) {
		let dateString = `${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}`;

		if (this.plugin.setting.dateFormat === "gregorian") {
			const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
			dateString = `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}`;
		}

		const notesLocation = this.plugin.setting.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
		});

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
		const fileName = `${jy}-W${weekNumber}.md`;
		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

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

	public async openOrCreateMonthlyNote(jy: number, jm: number, local: TLocal = "fa") {
		const fileName = `${jy}-${jm.toString().padStart(2, "0")}.md`;
		const notesLocation = this.plugin.setting.monthlyNotesPath;
		const filePath = this.buildNotePath(
			notesLocation,
			fileName,
			{
				jy,
				jm,
			},
			local,
		);

		const jMonthName = JALALI_MONTHS_NAME[local];

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد ماه‌نوشت جدید" : "Create New Monthly Note";
		const confirmMessage =
			lang === "fa"
				? `ماه‌نوشت ${jMonthName[jm]} ${jy} ایجاد شود؟`
				: `Create monthly note for ${jMonthName[jm]} ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "monthly",
		});
	}

	public async openOrCreateSeasonalNote(jy: number, seasonNumber: number, local: TLocal = "fa") {
		const fileName = `${jy}-S${seasonNumber}.md`;
		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const filePath = this.buildNotePath(
			notesLocation,
			fileName,
			{
				jy,
				season: seasonNumber,
			},
			local,
		);

		const seasonsName = SEASONS_NAME[local];

		const lang = this.plugin.setting.language;
		const confirmTitle = lang === "fa" ? "ایجاد فصل‌نوشت جدید" : "Create New Seasonal Note";
		const confirmMessage =
			lang === "fa"
				? `فصل‌نوشت ${seasonsName[seasonNumber]} ${jy} ایجاد شود؟`
				: `Create seasonal note for ${seasonsName[seasonNumber]} ${jy}?`;

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle,
			confirmMessage,
			noteType: "seasonal",
		});
	}

	public async openOrCreateYearlyNote(jy: number) {
		const fileName = `${jy}.md`;
		const notesLocation = this.plugin.setting.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

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
