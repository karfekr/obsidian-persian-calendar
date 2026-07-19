import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TLocal } from "src/types";
import type { TDateEngineContext } from "src/utils/dateEngine";
import { formatPattern } from "src/utils/dateEngine";
import { jalaliToGregorian, jalaliToSeason } from "src/utils/dateUtils";

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

	public buildNotePath(
		basePath: string | undefined,
		fileName: string,
		tokenContext: TDateEngineContext,
		local: TLocal = "fa",
	) {
		const normalized = this.normalizeFolderPath(basePath);
		const resolved = normalized
			? formatPattern(normalized, this.buildEngineContext(tokenContext), local)
			: "";

		return resolved ? `${resolved}/${fileName}` : fileName;
	}

	public buildDailyNoteFileName(jy: number, jm: number, jd: number) {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const context = this.buildEngineContext({ jy, jm, jd, gy, gm, gd });

		return formatPattern(this.plugin.setting.dailyNoteFormat, context, "fa");
	}

	public buildDailyNotePath(jy: number, jm: number, jd: number) {
		const dateString = this.buildDailyNoteFileName(jy, jm, jd);

		const notesLocation = this.plugin.setting.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
			jd,
		});

		return { filePath, dateString };
	}

	public buildWeeklyNotePath(jy: number, weekNumber: number) {
		const fileName = `${formatPattern("jYYYY-[W]W", { jy, week: weekNumber }, "fa")}.md`;
		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

		return { filePath, fileName };
	}

	public buildMonthlyNotePath(jy: number, jm: number, local: TLocal = "fa") {
		const fileName = `${formatPattern("jYYYY-jMM", { jy, jm }, local)}.md`;
		const notesLocation = this.plugin.setting.monthlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy, jm }, local);
		const jMonthName = JALALI_MONTHS_NAME[local][jm];

		return { filePath, fileName, jMonthName };
	}

	public buildSeasonalNotePath(jy: number, seasonNumber: number, local: TLocal = "fa") {
		const fileName = `${formatPattern("jYYYY-[S]Q", { jy, season: seasonNumber }, local)}.md`;
		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const filePath = this.buildNotePath(
			notesLocation,
			fileName,
			{ jy, season: seasonNumber },
			local,
		);
		const seasonName = SEASONS_NAME[local][seasonNumber];

		return { filePath, fileName, seasonName };
	}

	public buildYearlyNotePath(jy: number) {
		const fileName = `${formatPattern("jYYYY", { jy }, "fa")}.md`;
		const notesLocation = this.plugin.setting.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

		return { filePath, fileName };
	}
}
