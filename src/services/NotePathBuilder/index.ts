import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TDateEngineContext, TLocale } from "src/types";
import { formatPattern } from "src/utils/dateEngine";
import {
	getWeekStartCalculator,
	gregorianDayOfWeek,
	gregorianToJalali,
	jalaliToDate,
	jalaliToGregorian,
	jalaliToSeason,
} from "src/utils/dateUtils";
import { toWeekFormat } from "src/utils/formatters";
import { mapJalaliMonthToGregorianLabel, mapJalaliYearToGregorianLabel } from "./gregorianNaming";

export default class NotePathBuilder {
	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public normalizeFolderPath(path?: string | null) {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	public buildEngineContext(parts: TDateEngineContext): TDateEngineContext {
		let { gy, gm, gd, jy, jm, jd, week, season, quarter, dow } = parts;

		if (jm === undefined && season !== undefined) {
			jm = 3 * (season - 1) + 1;
			jd ??= 1;
		}

		if (jy !== undefined && jm !== undefined && jd !== undefined) {
			if (gy === undefined || gm === undefined || gd === undefined) {
				const derived = jalaliToGregorian(jy, jm, jd);
				gy ??= derived.gy;
				gm ??= derived.gm;
				gd ??= derived.gd;
			}
		} else if (gy !== undefined && gm !== undefined && gd !== undefined) {
			const derived = gregorianToJalali(gy, gm, gd);
			jy ??= derived.jy;
			jm ??= derived.jm;
			jd ??= derived.jd;
		}

		if (season === undefined && jm !== undefined) {
			season = jalaliToSeason(jm);
		}

		if (quarter === undefined && gm !== undefined) {
			quarter = Math.floor((gm - 1) / 3) + 1;
		}

		if (dow === undefined && gy !== undefined && gm !== undefined && gd !== undefined) {
			dow = gregorianDayOfWeek(gy, gm, gd);
		}

		return { gy, gm, gd, jy, jm, jd, week, season, quarter, dow };
	}

	private resolveFolderPattern(path: string | undefined, context: TDateEngineContext) {
		const normalized = this.normalizeFolderPath(path);
		return normalized ? formatPattern(normalized, this.buildEngineContext(context)) : "";
	}

	public buildNotePath(
		basePath: string | undefined,
		fileName: string,
		tokenContext: TDateEngineContext,
	) {
		const resolved = this.resolveFolderPattern(basePath, tokenContext);

		return resolved ? `${resolved}/${fileName}` : fileName;
	}

	private usesGregorianWeeks() {
		return this.plugin.setting.weekCalculation.startsWith("gregorian");
	}

	private getWeeklyAnchor(year: number, weekNumber: number) {
		const { weekCalculation, weeklyPathMonth } = this.plugin.setting;
		const calculator = getWeekStartCalculator(weekCalculation);
		const start = calculator.getStartOfWeek(year, weekNumber);
		const end = calculator.getEndOfWeek(year, weekNumber);
		const isGregorian = this.usesGregorianWeeks();
		const startYear = isGregorian ? start.gy : start.jy;
		const endYear = isGregorian ? end.gy : end.jy;

		// a week between two years stays in the year it belongs to
		if (startYear !== endYear) return startYear === year ? start : end;

		return weeklyPathMonth === "end" ? end : start;
	}

	private getDailyWeekContext(jy: number, jm: number, jd: number) {
		const calculator = getWeekStartCalculator(this.plugin.setting.weekCalculation);
		const date = jalaliToDate(jy, jm, jd);
		const { jy: weekYear, weekNumber } = calculator.getWeekNumber(date);
		const actualGregorian = jalaliToGregorian(jy, jm, jd);
		const actualCalendarYear = this.usesGregorianWeeks() ? actualGregorian.gy : jy;
		const nextYearWeekStart = calculator.getStartOfWeek(weekYear + 1, 1);
		const nextYearWeekStartKey =
			nextYearWeekStart.gy * 10000 + nextYearWeekStart.gm * 100 + nextYearWeekStart.gd;
		const actualDateKey =
			actualGregorian.gy * 10000 + actualGregorian.gm * 100 + actualGregorian.gd;

		if (actualCalendarYear === weekYear && actualDateKey >= nextYearWeekStartKey) {
			return { weekYear: weekYear + 1, weekNumber: 1 };
		}

		return { weekYear, weekNumber };
	}

	public buildDailyNoteFileName(jy: number, jm: number, jd: number) {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const context = this.buildEngineContext({
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
		});

		return formatPattern(this.plugin.setting.dailyNoteFormat, context);
	}

	public buildDailyNotePath(jy: number, jm: number, jd: number) {
		const dateString = this.buildDailyNoteFileName(jy, jm, jd);
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const { weekNumber } = this.getDailyWeekContext(jy, jm, jd);
		const notesLocation = this.plugin.setting.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
			week: weekNumber,
		});

		return { filePath, dateString };
	}

	public buildWeeklyNotePath(jy: number, weekNumber: number) {
		const { jy: jYear, jm, jd, gy, gm, gd } = this.getWeeklyAnchor(jy, weekNumber);

		const fileName = `${toWeekFormat(jy, weekNumber)}.md`;

		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy: jYear,
			jm,
			jd,
			gy,
			gm,
			gd,
			week: weekNumber,
		});

		return { filePath, fileName };
	}

	public buildMonthlyNotePath(jy: number, jm: number, local: TLocale = "fa") {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);

		let fileName: string;

		if (this.plugin.setting.monthlyNoteNaming === "gregorian") {
			const { year, month } = mapJalaliMonthToGregorianLabel(jy, jm);
			fileName = `${formatPattern("YYYY-MM", { gy: year, gm: month })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY-jMM", { jy, jm })}.md`;
		}

		const notesLocation = this.plugin.setting.monthlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy,
			jm,
			gy,
			gm,
			gd,
		});

		const jMonthName = JALALI_MONTHS_NAME[local][jm];

		return { filePath, fileName, jMonthName };
	}

	public buildSeasonalNotePath(jy: number, seasonNumber: number, local: TLocale = "fa") {
		const fileName = `${formatPattern("jYYYY-[S]jQ", {
			jy,
			season: seasonNumber,
		})}.md`;
		const jm = 3 * (seasonNumber - 1) + 1;
		const jd = 1;
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);

		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
			season: seasonNumber,
		});

		const seasonName = SEASONS_NAME[local][seasonNumber];

		return { filePath, fileName, seasonName };
	}

	public buildYearlyNotePath(jy: number) {
		const jm = 1;
		const jd = 1;
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);

		let fileName: string;

		if (this.plugin.setting.yearlyNoteNaming === "gregorian") {
			const { year } = mapJalaliYearToGregorianLabel(jy);
			fileName = `${formatPattern("YYYY", { gy: year })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY", { jy })}.md`;
		}

		const notesLocation = this.plugin.setting.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
		});

		return { filePath, fileName };
	}

	public buildDetectionPattern(): string | null {
		const folderPattern = this.normalizeFolderPath(this.plugin.setting.dailyNotesPath);
		const filePattern = this.plugin.setting.dailyNoteFormat;

		if (!filePattern) return null;

		return folderPattern ? `${folderPattern}/${filePattern}.md` : `${filePattern}.md`;
	}
}
