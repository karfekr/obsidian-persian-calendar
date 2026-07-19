import { TFile } from "obsidian";
import { Notice } from "src/components";
import { getDirection, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TBuildContext, TDateFormat, TSuggestProvider } from "src/types";
import {
	dashToDate,
	dashToEndDayOfJMonthDash,
	dashToEndDayOfSeasonDash,
	dashToEndDayOfWeekDash,
	dashToEndDayOfYearDash,
	dashToJMonthDash,
	dashToJMonthName,
	dashToJWeekDash,
	dashToSeasonDash,
	dashToSeasonName,
	dashToStartDayOfJMonthDash,
	dashToStartDayOfSeasonDash,
	dashToStartDayOfWeekDash,
	dashToStartDayOfYearDash,
	dateToDash,
	dateToJMonthDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToSeasonDash,
} from "src/utils/dashUtils";
import {
	dateToDayOfMonth,
	dateToDaysPassedJMonth,
	dateToDaysPassedJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingJMonth,
	dateToDaysRemainingJYear,
	dateToDaysRemainingSeason,
	dateToMonthName,
	dateToSeasonName,
	dateToWeekdayName,
	todayTehran,
} from "src/utils/dateUtils";
import { dashToEvents, dateToEvents, eventsToString } from "src/utils/eventUtils";
import { extractYearFormat } from "src/utils/formatters";

export default class Placeholder {
	plugin: PersianCalendarPlugin;
	private placeholderPatterns: Map<string, RegExp> = new Map();

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public getAllPlaceholderKeys(file?: TFile): string[] {
		const activeFile = file ?? this.plugin.app.workspace.getActiveFile();
		const context = activeFile
			? this.buildContext(activeFile)
			: { currentDate: todayTehran(), fileDate: null, fileName: "", baseDate: "" as TDateFormat };

		return Array.from(this.getPlaceholderMap(context).keys());
	}

	public async getTemplateContent(templatePath: string, targetFile: TFile): Promise<string | null> {
		if (!templatePath.trim()) return null;

		const templateFile = this.plugin.app.vault.getAbstractFileByPath(templatePath);
		if (!templateFile || !(templateFile instanceof TFile)) return null;

		try {
			const templateContent = await this.plugin.app.vault.read(templateFile);
			return this.processPlaceholders(targetFile, templateContent);
		} catch {
			return null;
		}
	}

	public async insertPersianDate(file: TFile) {
		const fileContent = await this.plugin.app.vault.read(file);
		const updatedContent = this.processPlaceholders(file, fileContent);

		if (updatedContent !== fileContent) {
			await this.plugin.app.vault.modify(file, updatedContent);
			Notice(t("notice.success.placeholder"), getDirection());
		}
	}

	private getOrCreatePattern(placeholder: string): RegExp {
		let pattern = this.placeholderPatterns.get(placeholder);
		if (!pattern) {
			const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			pattern = new RegExp(escaped, "g");
			this.placeholderPatterns.set(placeholder, pattern);
		}
		return pattern;
	}

	private processPlaceholders(file: TFile, content: string): string {
		const context = this.buildContext(file);

		let result = content;
		for (const [placeholder, value] of this.getPlaceholderMap(context).entries()) {
			if (value === null || !result.includes(placeholder)) continue;

			result = result.replace(this.getOrCreatePattern(placeholder), String(value));
		}

		return result;
	}

	private buildContext(file: TFile): TBuildContext {
		const fileName = file.basename;
		const baseDate = this.plugin.setting.dateFormat;

		return {
			currentDate: todayTehran(),
			fileDate: dashToDate(fileName, baseDate),
			fileName,
			baseDate,
		};
	}

	private getPlaceholderMap({
		currentDate,
		fileName,
		fileDate,
		baseDate,
	}: TBuildContext): Map<string, string | number | boolean | null | undefined> {
		const fromFile = <T>(fn: (d: Date) => T): T | null => (fileDate ? fn(fileDate) : null);
		const fromFileOrToday = <T>(fn: (d: Date) => T): T => fn(fileDate ?? currentDate);

		return new Map<string, string | number | null | undefined>([
			["{{تاریخ شمسی جاری}}", dateToDash(currentDate, "jalali")],
			["{{تاریخ میلادی جاری}}", dateToDash(currentDate, "gregorian")],
			["{{تاریخ قمری جاری}}", dateToDash(currentDate, "hijri")],
			["{{روز هفته جاری}}", dateToWeekdayName(currentDate)],
			["{{هفته جاری}}", dateToJWeekDash(currentDate)],
			["{{نام ماه جاری}}", dateToMonthName(currentDate)],
			["{{روز ماه جاری}}", dateToDayOfMonth(currentDate)],
			["{{ماه جاری}}", dateToJMonthDash(currentDate)],
			["{{نام فصل جاری}}", dateToSeasonName(currentDate)],
			["{{فصل جاری}}", dateToSeasonDash(currentDate)],
			["{{سال جاری}}", dateToJYearDash(currentDate)],
			[
				"{{مناسبت جاری}}",
				eventsToString(
					dateToEvents(currentDate, {
						showEvents: this.plugin.setting,
						hijriBase: this.plugin.setting.hijriBase,
					}),
				),
			],

			["{{تاریخ شمسی یادداشت}}", fromFile((d) => dateToDash(d, "jalali"))],
			["{{تاریخ میلادی یادداشت}}", fromFile((d) => dateToDash(d, "gregorian"))],
			["{{تاریخ قمری یادداشت}}", fromFile((d) => dateToDash(d, "hijri"))],
			["{{روز هفته یادداشت}}", fromFile(dateToWeekdayName)],
			["{{هفته یادداشت}}", dashToJWeekDash(fileName, baseDate)],
			["{{نام ماه یادداشت}}", dashToJMonthName(fileName, baseDate)],
			["{{روز ماه یادداشت}}", fromFile(dateToDayOfMonth)],
			["{{ماه یادداشت}}", dashToJMonthDash(fileName, baseDate)],
			["{{نام فصل یادداشت}}", dashToSeasonName(fileName, baseDate)],
			["{{فصل یادداشت}}", dashToSeasonDash(fileName, baseDate)],
			["{{سال یادداشت}}", fileDate ? dateToJYearDash(fileDate) : extractYearFormat(fileName)],
			[
				"{{مناسبت یادداشت}}",
				eventsToString(
					dashToEvents(fileName, baseDate, {
						showEvents: this.plugin.setting,
						hijriBase: this.plugin.setting.hijriBase,
					}),
				),
			],

			["{{روزهای گذشته سال}}", fromFileOrToday(dateToDaysPassedJYear)],
			["{{روزهای باقیمانده سال}}", fromFileOrToday(dateToDaysRemainingJYear)],
			["{{روزهای گذشته فصل}}", fromFileOrToday(dateToDaysPassedSeason)],
			["{{روزهای باقیمانده فصل}}", fromFileOrToday(dateToDaysRemainingSeason)],
			["{{روزهای گذشته ماه}}", fromFileOrToday(dateToDaysPassedJMonth)],
			["{{روزهای باقیمانده ماه}}", fromFileOrToday(dateToDaysRemainingJMonth)],

			["{{اول سال}}", dashToStartDayOfYearDash(fileName, baseDate)],
			["{{آخر سال}}", dashToEndDayOfYearDash(fileName, baseDate)],
			["{{اول هفته}}", dashToStartDayOfWeekDash(fileName, baseDate)],
			["{{آخر هفته}}", dashToEndDayOfWeekDash(fileName, baseDate)],
			["{{اول ماه}}", dashToStartDayOfJMonthDash(fileName, baseDate)],
			["{{آخر ماه}}", dashToEndDayOfJMonthDash(fileName, baseDate)],
			["{{اول فصل}}", dashToStartDayOfSeasonDash(fileName, baseDate)],
			["{{آخر فصل}}", dashToEndDayOfSeasonDash(fileName, baseDate)],
		]);
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /\{\{[^}]*$/,
			getSuggestions: (query: string) =>
				this.getAllPlaceholderKeys().filter((key) =>
					key.replace(/^\{\{|\}\}$/g, "").includes(query),
				),
			onSelect: (value: string) => value,
		};
	}
}
