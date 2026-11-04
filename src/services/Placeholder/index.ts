import { TFile } from "obsidian";
import { Notice } from "src/components";
import { getDirection, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type {
	TBuildContext,
	TDateEngineContext,
	TDateFormat,
	TJalali,
	TSuggestProvider,
} from "src/types";
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
	gregorianDashToDate,
} from "src/utils/dashUtils";
import { parsePattern } from "src/utils/dateEngine";
import {
	checkKabiseh,
	checkValidJalali,
	dateToDayOfMonth,
	dateToDaysPassedJMonth,
	dateToDaysPassedJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingJMonth,
	dateToDaysRemainingJYear,
	dateToDaysRemainingSeason,
	dateToEndDayOfJMonthDate,
	dateToEndDayOfSeasonDate,
	dateToJalali,
	dateToMonthName,
	dateToSeasonName,
	dateToStartDayOfJMonthDate,
	dateToStartDayOfSeasonDate,
	dateToWeekdayName,
	getWeekStartCalculator,
	gregorianToJalali,
	jalaliToDate,
	todayTehran,
} from "src/utils/dateUtils";
import { dashToEvents, dateToEvents, eventsToString } from "src/utils/eventUtils";
import { extractYearFormat, toDayFormat } from "src/utils/formatters";

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

	public processPlaceholders(file: TFile, content: string): string {
		const context = this.buildContext(file);

		let result = content;
		for (const [placeholder, value] of this.getPlaceholderMap(context).entries()) {
			if (value === null || !result.includes(placeholder)) continue;

			result = result.replace(this.getOrCreatePattern(placeholder), String(value));
		}

		return result;
	}

	private resolveJalaliFromContext(ctx: TDateEngineContext): TJalali | null {
		if (this.plugin.noteService) {
			return this.plugin.noteService.resolveJalaliFromContext(ctx);
		}
		if (ctx.jy !== undefined && ctx.jm !== undefined && ctx.jd !== undefined) {
			if (!checkValidJalali(ctx.jy, ctx.jm, ctx.jd)) return null;
			return { jy: ctx.jy, jm: ctx.jm, jd: ctx.jd };
		}
		if (ctx.gy !== undefined && ctx.gm !== undefined && ctx.gd !== undefined) {
			try {
				return gregorianToJalali(ctx.gy, ctx.gm, ctx.gd);
			} catch {
				return null;
			}
		}
		return null;
	}

	public resolveNoteDate(file: TFile): Date | null {
		try {
			if (this.plugin.noteService) {
				const dailyDate = this.plugin.noteService.getDailyNoteDate(file);
				if (dailyDate) {
					return jalaliToDate(dailyDate.jy, dailyDate.jm, dailyDate.jd);
				}
			}

			const pathBuilder = new NotePathBuilder(this.plugin);
			const detectionPattern = pathBuilder.buildDetectionPattern();
			if (detectionPattern && file.path) {
				const parsed = parsePattern(detectionPattern, file.path);
				if (parsed) {
					const jDate = this.resolveJalaliFromContext(parsed);
					if (jDate) {
						return jalaliToDate(jDate.jy, jDate.jm, jDate.jd);
					}
				}
			}

			const dailyNoteFormat = this.plugin.setting.dailyNoteFormat;
			if (dailyNoteFormat && file.basename) {
				const parsed = parsePattern(dailyNoteFormat, file.basename);
				if (parsed) {
					const jDate = this.resolveJalaliFromContext(parsed);
					if (jDate) {
						return jalaliToDate(jDate.jy, jDate.jm, jDate.jd);
					}
				}
			}

			if (file.basename) {
				const match = file.basename.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
				if (match) {
					const y = Number(match[1]);
					const m = Number(match[2]);
					const d = Number(match[3]);
					const padded = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
					if (y >= 1800 && y <= 2200) {
						return gregorianDashToDate(padded);
					}
					if (y >= 1200 && y < 1700 && checkValidJalali(y, m, d)) {
						return jalaliToDate(y, m, d);
					}
					if (this.plugin.setting.dateFormat === "jalali" && checkValidJalali(y, m, d)) {
						return jalaliToDate(y, m, d);
					}
					return gregorianDashToDate(padded);
				}

				const inTextMatch = file.basename.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
				if (inTextMatch) {
					const y = Number(inTextMatch[1]);
					const m = Number(inTextMatch[2]);
					const d = Number(inTextMatch[3]);
					if (y >= 1800 && y <= 2200) {
						return gregorianDashToDate(inTextMatch[0]);
					}
					if (y >= 1200 && y < 1700 && checkValidJalali(y, m, d)) {
						return jalaliToDate(y, m, d);
					}
				}

				const fromDash = dashToDate(file.basename, this.plugin.setting.dateFormat);
				if (fromDash) return fromDash;
			}

			return null;
		} catch {
			return null;
		}
	}

	public buildContext(file: TFile): TBuildContext {
		const fileName = file.basename;
		const baseDate = this.plugin.setting.dateFormat;

		return {
			currentDate: todayTehran(),
			fileDate: this.resolveNoteDate(file),
			fileName,
			baseDate,
		};
	}

	private getStartOfWeekDash(date: Date, dateFormat: TDateFormat): string {
		const calculator = getWeekStartCalculator(this.plugin.setting.weekCalculation);
		const { jy: jYear, weekNumber } = calculator.getWeekNumber(date, "sat");
		const { jy, jm, jd, gy, gm, gd } = calculator.getStartOfWeek(jYear, weekNumber, "sat");
		return dateFormat === "jalali" ? toDayFormat(jy, jm, jd) : toDayFormat(gy, gm, gd);
	}

	private getEndOfWeekDash(date: Date, dateFormat: TDateFormat): string {
		const calculator = getWeekStartCalculator(this.plugin.setting.weekCalculation);
		const { jy: jYear, weekNumber } = calculator.getWeekNumber(date, "sat");
		const { jy, jm, jd, gy, gm, gd } = calculator.getEndOfWeek(jYear, weekNumber, "sat");
		return dateFormat === "jalali" ? toDayFormat(jy, jm, jd) : toDayFormat(gy, gm, gd);
	}

	private getStartOfYearDash(date: Date, dateFormat: TDateFormat): string {
		const { jy } = dateToJalali(date);
		const startDate = jalaliToDate(jy, 1, 1);
		return dateToDash(startDate, dateFormat) ?? "";
	}

	private getEndOfYearDash(date: Date, dateFormat: TDateFormat): string {
		const { jy } = dateToJalali(date);
		const endDay = checkKabiseh(jy) ? 30 : 29;
		const endDate = jalaliToDate(jy, 12, endDay);
		return dateToDash(endDate, dateFormat) ?? "";
	}

	public getPlaceholderMap({
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
			[
				"{{نام ماه یادداشت}}",
				fileDate ? dateToMonthName(fileDate) : dashToJMonthName(fileName, baseDate),
			],
			["{{روز ماه یادداشت}}", fromFile(dateToDayOfMonth)],
			[
				"{{ماه یادداشت}}",
				fileDate ? dateToJMonthDash(fileDate) : dashToJMonthDash(fileName, baseDate),
			],
			[
				"{{نام فصل یادداشت}}",
				fileDate ? dateToSeasonName(fileDate) : dashToSeasonName(fileName, baseDate),
			],
			[
				"{{فصل یادداشت}}",
				fileDate ? dateToSeasonDash(fileDate) : dashToSeasonDash(fileName, baseDate),
			],
			["{{سال یادداشت}}", fileDate ? dateToJYearDash(fileDate) : extractYearFormat(fileName)],
			[
				"{{مناسبت یادداشت}}",
				eventsToString(
					fileDate
						? dateToEvents(fileDate, {
								showEvents: this.plugin.setting,
								hijriBase: this.plugin.setting.hijriBase,
							})
						: dashToEvents(fileName, baseDate, {
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

			[
				"{{اول هفته}}",
				fileDate
					? this.getStartOfWeekDash(fileDate, baseDate)
					: dashToStartDayOfWeekDash(fileName, baseDate, {
							mode: this.plugin.setting.weekCalculation,
						}),
			],
			[
				"{{آخر هفته}}",
				fileDate
					? this.getEndOfWeekDash(fileDate, baseDate)
					: dashToEndDayOfWeekDash(fileName, baseDate, {
							mode: this.plugin.setting.weekCalculation,
						}),
			],
			[
				"{{هفته جاری}}",
				dateToJWeekDash(currentDate, undefined, { mode: this.plugin.setting.weekCalculation }),
			],
			[
				"{{هفته یادداشت}}",
				fileDate
					? dateToJWeekDash(fileDate, undefined, { mode: this.plugin.setting.weekCalculation })
					: dashToJWeekDash(fileName, baseDate, { mode: this.plugin.setting.weekCalculation }),
			],

			[
				"{{اول سال}}",
				fileDate
					? this.getStartOfYearDash(fileDate, baseDate)
					: dashToStartDayOfYearDash(fileName, baseDate),
			],
			[
				"{{آخر سال}}",
				fileDate
					? this.getEndOfYearDash(fileDate, baseDate)
					: dashToEndDayOfYearDash(fileName, baseDate),
			],
			[
				"{{اول ماه}}",
				fileDate
					? dateToDash(dateToStartDayOfJMonthDate(fileDate), baseDate)
					: dashToStartDayOfJMonthDash(fileName, baseDate),
			],
			[
				"{{آخر ماه}}",
				fileDate
					? dateToDash(dateToEndDayOfJMonthDate(fileDate), baseDate)
					: dashToEndDayOfJMonthDash(fileName, baseDate),
			],
			[
				"{{اول فصل}}",
				fileDate
					? dateToDash(dateToStartDayOfSeasonDate(fileDate), baseDate)
					: dashToStartDayOfSeasonDash(fileName, baseDate),
			],
			[
				"{{آخر فصل}}",
				fileDate
					? dateToDash(dateToEndDayOfSeasonDate(fileDate), baseDate)
					: dashToEndDayOfSeasonDash(fileName, baseDate),
			],
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
