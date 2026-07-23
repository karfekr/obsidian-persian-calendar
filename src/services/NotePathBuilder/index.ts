import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TLocale } from "src/types";
import type { TDateEngineContext } from "src/utils/dateEngine";
import { formatPattern } from "src/utils/dateEngine";
import { jalaliToGregorian, jalaliToSeason } from "src/utils/dateUtils";
import { mapJalaliMonthToGregorianLabel, mapJalaliYearToGregorianLabel } from "./gregorianNaming";

export default class NotePathBuilder {
	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public normalizeFolderPath(path?: string | null) {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	public buildEngineContext(parts: TDateEngineContext): TDateEngineContext {
		if (parts.season !== undefined || parts.jm === undefined) {
			return parts;
		}

		return { ...parts, season: jalaliToSeason(parts.jm) };
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

	public buildDailyNoteFileName(jy: number, jm: number, jd: number) {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const context = this.buildEngineContext({ jy, jm, jd, gy, gm, gd });

		return formatPattern(this.plugin.setting.dailyNoteFormat, context);
	}

	public buildDailyNotePath(jy: number, jm: number, jd: number) {
		const dateString = this.buildDailyNoteFileName(jy, jm, jd);

		// Daily Notes always use real Jalali <-> Gregorian conversion, for both
		// the file name (above) and the folder path (below), so dynamic paths
		// can mix Gregorian and Jalali tokens (e.g. "YYYY/jMM/jDD").
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const notesLocation = this.plugin.setting.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
		});

		return { filePath, dateString };
	}

	public buildWeeklyNotePath(jy: number, weekNumber: number) {
		const fileName = `${formatPattern("jYYYY-[W]W", {
			jy,
			week: weekNumber,
		})}.md`;

		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

		return { filePath, fileName };
	}

	public buildMonthlyNotePath(jy: number, jm: number, local: TLocale = "fa") {
		// Month Notes represent a range; per the range-handling rule, dynamic
		// folder path tokens are resolved using the start date of the range
		// (the first day of the Jalali month), via real date conversion.
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);

		let fileName: string;

		if (this.plugin.setting.monthlyNoteNaming === "gregorian") {
			const { year, month } = mapJalaliMonthToGregorianLabel(jy, jm);
			fileName = `${formatPattern("YYYY-MM", { gy: year, gm: month })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY-jMM", { jy, jm })}.md`;
		}

		const notesLocation = this.plugin.setting.monthlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy, jm, gy, gm, gd });

		const jMonthName = JALALI_MONTHS_NAME[local][jm];

		return { filePath, fileName, jMonthName };
	}

	public buildSeasonalNotePath(jy: number, seasonNumber: number, local: TLocale = "fa") {
		const fileName = `${formatPattern("jYYYY-[S]Q", {
			jy,
			season: seasonNumber,
		})}.md`;

		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy,
			season: seasonNumber,
		});

		const seasonName = SEASONS_NAME[local][seasonNumber];

		return { filePath, fileName, seasonName };
	}

	public buildYearlyNotePath(jy: number) {
		// Year Notes represent a range; resolve dynamic folder path tokens using
		// the start date of the range (the first day of the Jalali year).
		const { gy, gm, gd } = jalaliToGregorian(jy, 1, 1);

		let fileName: string;

		if (this.plugin.setting.yearlyNoteNaming === "gregorian") {
			const { year } = mapJalaliYearToGregorianLabel(jy);
			fileName = `${formatPattern("YYYY", { gy: year })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY", { jy })}.md`;
		}

		const notesLocation = this.plugin.setting.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy, gy, gm, gd });

		return { filePath, fileName };
	}

	public buildDetectionPattern(): string | null {
		const folderPattern = this.normalizeFolderPath(this.plugin.setting.dailyNotesPath);

		const filePattern = this.plugin.setting.dailyNoteFormat;

		if (!filePattern) return null;

		return folderPattern ? `${folderPattern}/${filePattern}.md` : `${filePattern}.md`;
	}
}
