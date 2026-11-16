import type { CalendarDate } from "@internationalized/date";
import type { EditorSuggestContext } from "obsidian";
import { SMART_DATE_LINKS, WEEKDAYS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type { TLocale, TSuggestProvider } from "src/types";
import {
	dateToDash,
	dateToJMonthDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToSeasonDash,
} from "src/utils/dashUtils";
import {
	dateToJalali,
	getWeekdayTehran,
	getWeekStartCalculator,
	todayTehran,
} from "src/utils/dateUtils";
import {
	getNaturalDateSuggestions,
	normalizePersianQuery,
	parseNaturalPersianDate,
} from "./naturalDateParser";

export default class SmartDateLinker {
	plugin: PersianCalendarPlugin;
	private readonly pathBuilder: NotePathBuilder;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
		this.pathBuilder = new NotePathBuilder(plugin);
	}

	private makeOutput(dash: string | null, label: string, link = true): string {
		if (!dash) return label;
		return link ? `[[${dash}|${label}]]` : dash;
	}

	private dateToDashByFormat(date: CalendarDate) {
		return dateToDash(date, this.plugin.setting.dateFormat);
	}

	private makeDailyOutput(date: CalendarDate, label: string, link: boolean): string {
		const display = this.dateToDashByFormat(date);
		if (!link) return display ?? label;
		const { jy, jm, jd } = dateToJalali(date);
		const { filePath } = this.pathBuilder.buildDailyNotePath(jy, jm, jd);
		return `[[${filePath.slice(0, -3)}|${label}]]`;
	}

	private adjustedDate(base: CalendarDate, days = 0, months = 0, years = 0): CalendarDate {
		// Match the existing Gregorian overflow semantics without introducing timestamps.
		let d = base.add({ days });
		if (months)
			d = d
				.set({ day: 1 })
				.add({ months })
				.add({ days: d.day - 1 });
		if (years)
			d = d
				.set({ day: 1 })
				.add({ years })
				.add({ days: d.day - 1 });
		return d;
	}

	formatSmartDate(keyword: string, date: CalendarDate, local: TLocale = "fa", link = true): string {
		const now = date;
		const ERROR_LINK = "تاریخ شناسایی نشد";
		const trimmed = keyword.trim();
		const normalized = normalizePersianQuery(trimmed);

		type PeriodConfig = {
			fn: (d: CalendarDate) => string;
			days?: number;
			months?: number;
			years?: number;
		};

		const weekDashFn = (d: CalendarDate) =>
			dateToJWeekDash(d, undefined, { mode: this.plugin.setting.weekCalculation });
		const weekOffsets: Record<string, number> = {
			"این هفته": 0,
			"هفته قبل": -7,
			"هفته گذشته": -7,
			"هفته پیش": -7,
			"هفته بعد": 7,
			"هفته آینده": 7,
		};
		if (normalized in weekOffsets) {
			const target = this.adjustedDate(now, weekOffsets[normalized]);
			if (!link) return weekDashFn(target);
			const { jy, weekNumber } = getWeekStartCalculator(
				this.plugin.setting.weekCalculation,
			).getWeekNumber(target);
			const filePath =
				this.plugin.noteService?.getWeeklyNoteFile(jy, weekNumber)?.path ??
				this.pathBuilder.buildWeeklyNotePath(jy, weekNumber).filePath;
			return this.makeOutput(filePath.slice(0, -3), trimmed);
		}

		const periodMap: Partial<Record<string, PeriodConfig>> = {
			"این ماه": { fn: dateToJMonthDash },
			"ماه قبل": { fn: dateToJMonthDash, months: -1 },
			"ماه گذشته": { fn: dateToJMonthDash, months: -1 },
			"ماه پیش": { fn: dateToJMonthDash, months: -1 },
			"ماه بعد": { fn: dateToJMonthDash, months: 1 },
			"ماه آینده": { fn: dateToJMonthDash, months: 1 },
			"این فصل": { fn: dateToSeasonDash },
			"فصل قبل": { fn: dateToSeasonDash, months: -3 },
			"فصل گذشته": { fn: dateToSeasonDash, months: -3 },
			"فصل پیش": { fn: dateToSeasonDash, months: -3 },
			"فصل بعد": { fn: dateToSeasonDash, months: 3 },
			"فصل آینده": { fn: dateToSeasonDash, months: 3 },
			امسال: { fn: dateToJYearDash },
			"سال قبل": { fn: dateToJYearDash, years: -1 },
			"سال گذشته": { fn: dateToJYearDash, years: -1 },
			"سال پیش": { fn: dateToJYearDash, years: -1 },
			"سال بعد": { fn: dateToJYearDash, years: 1 },
			"سال آینده": { fn: dateToJYearDash, years: 1 },
		};

		const period = periodMap[normalized];

		if (period) {
			const { fn, days, months, years } = period;

			return this.makeOutput(fn(this.adjustedDate(now, days, months, years)), trimmed, link);
		}

		const naturalDate = parseNaturalPersianDate(trimmed, now);
		if (naturalDate) {
			return this.makeDailyOutput(naturalDate, trimmed, link);
		}

		const weekdaysName = WEEKDAYS_NAME[local];
		const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
		const match = trimmed.match(regex);

		if (match) {
			const [, weekdayName, specifier = ""] = match;
			const weekdayEntry = Object.entries(weekdaysName).find(([, name]) => name === weekdayName);
			if (!weekdayEntry) return ERROR_LINK;

			const weekdayIndex = Number(weekdayEntry[0]);
			const todayIndex = getWeekdayTehran(now) === 6 ? 1 : getWeekdayTehran(now) + 2;
			const daysOffset = (weekdayIndex - todayIndex + 7) % 7;
			const extraWeeks = specifier.includes("بعد") ? 7 : specifier.includes("قبل") ? -7 : 0;

			const target = now.add({ days: daysOffset + extraWeeks });

			const label = weekdayName + (specifier ? ` ${specifier.trim()}` : "");
			return this.makeDailyOutput(target, label, link);
		}

		return ERROR_LINK;
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /(?<=^|[\s([«])@\/?(?:[^\s@]+(?:\s+[^\s@]+){0,4}\s*)?$/,

			getSuggestions: (query: string) => {
				const raw = query.startsWith("/") ? query.slice(1) : query;
				const trimmed = raw.trim();
				if (!trimmed) {
					return [...SMART_DATE_LINKS];
				}

				const normalizedQuery = normalizePersianQuery(trimmed);
				const staticMatches = SMART_DATE_LINKS.filter(
					(s) => s.startsWith(trimmed) || normalizePersianQuery(s).startsWith(normalizedQuery),
				);

				const dynamicMatches = getNaturalDateSuggestions(trimmed, todayTehran());
				const combined = [...staticMatches];
				for (const item of dynamicMatches) {
					if (
						!combined.some(
							(existing) => normalizePersianQuery(existing) === normalizePersianQuery(item),
						)
					) {
						combined.push(item);
					} else if (item === trimmed && !combined.includes(trimmed)) {
						combined.unshift(trimmed);
					}
				}

				return combined;
			},

			onSelect: (value: string, ctx: EditorSuggestContext) => {
				const query = typeof ctx === "string" ? ctx : ctx.query;
				const isPlain = query.startsWith("/");

				return this.formatSmartDate(value, todayTehran(), "fa", !isPlain);
			},
		};
	}
}
