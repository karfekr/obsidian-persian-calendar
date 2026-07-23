import type { EditorSuggestContext } from "obsidian";
import { SMART_DATE_LINKS, WEEKDAYS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TDateFormatWithoutHijri, TLocale, TSuggestProvider } from "src/types";
import {
	dateToDash,
	dateToJMonthDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToSeasonDash,
} from "src/utils/dashUtils";
import { todayTehran } from "src/utils/dateUtils";

export default class SmartDateLinker {
	plugin: PersianCalendarPlugin;
	dateFormat: TDateFormatWithoutHijri;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
		this.dateFormat = plugin.setting.dateFormat;
	}

	private makeOutput(dash: string | null, label: string, link = true): string {
		if (!dash) return label;
		return link ? `[[${dash}|${label}]]` : dash;
	}

	private dateToDashByFormat(date: Date) {
		return dateToDash(date, this.dateFormat === "gregorian" ? "gregorian" : "jalali");
	}

	private adjustedDate(base: Date, days = 0, months = 0, years = 0): Date {
		const d = new Date(base);
		if (days) d.setDate(d.getDate() + days);
		if (months) d.setMonth(d.getMonth() + months);
		if (years) d.setFullYear(d.getFullYear() + years);
		return d;
	}

	formatSmartDate(keyword: string, date: Date, local: TLocale = "fa", link = true): string {
		const now = todayTehran();
		const ERROR_LINK = "تاریخ شناسایی نشد";

		const weekdaysName = WEEKDAYS_NAME[local];
		const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
		const match = keyword.match(regex);

		if (match) {
			const [, weekdayName, specifier = ""] = match;
			const weekdayEntry = Object.entries(weekdaysName).find(([, name]) => name === weekdayName);
			if (!weekdayEntry) return ERROR_LINK;

			const weekdayIndex = Number(weekdayEntry[0]);
			const todayIndex = now.getDay() === 6 ? 1 : now.getDay() + 2;
			const daysOffset = (weekdayIndex - todayIndex + 7) % 7;
			const extraWeeks = specifier.includes("بعد") ? 7 : specifier.includes("قبل") ? -7 : 0;

			now.setDate(now.getDate() + daysOffset + extraWeeks);

			const label = weekdayName + (specifier ? ` ${specifier.trim()}` : "");
			return this.makeOutput(this.dateToDashByFormat(now), label, link);
		}

		const dayOffsets: Record<string, number> = {
			امروز: 0,
			فردا: 1,
			دیروز: -1,
			پریروز: -2,
			پس‌فردا: 2,
		};

		if (keyword in dayOffsets) {
			return this.makeOutput(
				this.dateToDashByFormat(this.adjustedDate(date, dayOffsets[keyword])),
				keyword,
				link,
			);
		}

		type PeriodConfig = {
			fn: (d: Date) => string;
			days?: number;
			months?: number;
			years?: number;
		};

		const weekDashFn = (d: Date) =>
			dateToJWeekDash(d, undefined, { mode: this.plugin.setting.weekCalculation });

		const periodMap: Partial<Record<string, PeriodConfig>> = {
			"این هفته": { fn: weekDashFn },
			"هفته قبل": { fn: weekDashFn, days: -7 },
			"هفته بعد": { fn: weekDashFn, days: 7 },
			"این ماه": { fn: dateToJMonthDash },
			"ماه قبل": { fn: dateToJMonthDash, months: -1 },
			"ماه بعد": { fn: dateToJMonthDash, months: 1 },
			"این فصل": { fn: dateToSeasonDash },
			"فصل قبل": { fn: dateToSeasonDash, months: -3 },
			"فصل بعد": { fn: dateToSeasonDash, months: 3 },
			امسال: { fn: dateToJYearDash },
			"سال قبل": { fn: dateToJYearDash, years: -1 },
			"سال بعد": { fn: dateToJYearDash, years: 1 },
		};

		const period = periodMap[keyword];

		if (period) {
			const { fn, days, months, years } = period;

			return this.makeOutput(fn(this.adjustedDate(now, days, months, years)), keyword, link);
		}

		return ERROR_LINK;
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /@\/?[^@\s]*$/,

			getSuggestions: (query: string) => {
				const normalized = query.startsWith("/") ? query.slice(1) : query;
				return SMART_DATE_LINKS.filter((s) => s.startsWith(normalized));
			},

			onSelect: (value: string, ctx: EditorSuggestContext) => {
				const query = typeof ctx === "string" ? ctx : ctx.query;
				const normalized = query.startsWith("/") ? query.slice(1) : query;
				const isPlain = query.startsWith("/");

				return this.formatSmartDate(normalized || value, todayTehran(), "fa", !isPlain);
			},
		};
	}
}
