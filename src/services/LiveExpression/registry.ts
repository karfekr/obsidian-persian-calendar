import { toCalendarDate } from "@internationalized/date";
import {
	GREGORIAN_MONTHS_NAME,
	HIJRI_MONTHS_NAME,
	JALALI_MONTHS_NAME,
	SEASONS_NAME,
	WEEKDAYS_NAME,
} from "src/constants";
import type PersianCalendarPlugin from "src/main";
import {
	dateToDaysPassedJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingSeason,
	dateToHijri,
	dateToJalali,
	getDaysInJalaliYear,
	getWeekdayTehran,
	getWeekStartCalculator,
	jalaliMonthLength,
	jalaliToSeason,
	nowTehran,
} from "src/utils/dateUtils";
import { dateToEvents } from "src/utils/eventUtils";

export type TLiveExpressionCadence = "second" | "minute" | "day";

export class ExpressionContext {
	readonly now = nowTehran();
	readonly date = toCalendarDate(this.now);
	private jalaliDate?: ReturnType<typeof dateToJalali>;
	private hijriDate?: ReturnType<typeof dateToHijri>;

	constructor(private readonly plugin: PersianCalendarPlugin) {}

	get jalali() {
		this.jalaliDate ??= dateToJalali(this.date);
		return this.jalaliDate;
	}

	get hijri() {
		this.hijriDate ??= dateToHijri(this.date, { base: this.plugin.setting.hijriBase });
		return this.hijriDate;
	}

	get weekday() {
		// Saturday = 1, Friday = 7.
		return ((getWeekdayTehran(this.date) + 1) % 7) + 1;
	}

	get weekNumber() {
		return getWeekStartCalculator(this.plugin.setting.weekCalculation).getWeekNumber(this.date)
			.weekNumber;
	}

	get season() {
		return jalaliToSeason(this.jalali.jm);
	}

	get daysInYear() {
		return getDaysInJalaliYear(this.jalali.jy);
	}

	get daysInMonth() {
		const { jy, jm } = this.jalali;
		return jalaliMonthLength(jy, jm);
	}

	get dayOfYear() {
		return dateToDaysPassedJYear(this.date);
	}

	get daysLeftInYear() {
		return this.daysInYear - this.dayOfYear;
	}

	get daysLeftInMonth() {
		return this.daysInMonth - this.jalali.jd;
	}

	get minutesElapsed() {
		return this.now.hour * 60 + this.now.minute;
	}

	get minutesLeft() {
		return 1440 - this.minutesElapsed;
	}

	get events() {
		const { setting } = this.plugin;
		return dateToEvents(this.date, {
			showEvents: setting,
			hijriBase: setting.hijriBase,
			customEvents: this.plugin.getAllCustomEvents(),
		});
	}

	get outputLanguage() {
		return this.plugin.setting.liveExpressionOutputLanguage;
	}

	get isHoliday() {
		return this.weekday === 7 || this.events.some((event) => event.isHolidayInIran);
	}
}

type Expression = {
	evaluate: (context: ExpressionContext) => string | number;
	cadence?: TLiveExpressionCadence;
};

function expression(
	evaluate: Expression["evaluate"],
	options?: Omit<Expression, "evaluate">,
): Expression {
	return { evaluate, ...options };
}

const pad2 = (value: number) => String(value).padStart(2, "0");
const localizedText = {
	fa: { yes: "بله", no: "خیر", noEvents: "بدون مناسبت" },
	en: { yes: "Yes", no: "No", noEvents: "No events" },
} as const;
const yesNo = (condition: boolean, context: ExpressionContext) =>
	localizedText[context.outputLanguage][condition ? "yes" : "no"];
const gregorianMonthName = ({ now, outputLanguage }: ExpressionContext) =>
	GREGORIAN_MONTHS_NAME[outputLanguage][now.month];
const hijriMonthName = (context: ExpressionContext) =>
	HIJRI_MONTHS_NAME[context.outputLanguage][context.hijri.hm].trim();

const elapsedFractions = {
	year: (context: ExpressionContext) => context.dayOfYear / context.daysInYear,
	season: (context: ExpressionContext) => {
		const elapsed = dateToDaysPassedSeason(context.date);
		return elapsed / (elapsed + dateToDaysRemainingSeason(context.date));
	},
	month: (context: ExpressionContext) => context.jalali.jd / context.daysInMonth,
	week: (context: ExpressionContext) => context.weekday / 7,
	day: (context: ExpressionContext) => context.minutesElapsed / 1440,
};

const percent =
	(fraction: (context: ExpressionContext) => number) => (context: ExpressionContext) =>
		(fraction(context) * 100).toFixed(1);

const canonicalExpressions = {
	// Time
	ساعت: expression(({ now }) => pad2(now.hour), { cadence: "minute" }),
	دقیقه: expression(({ now }) => pad2(now.minute), { cadence: "minute" }),
	ثانیه: expression(({ now }) => pad2(now.second), { cadence: "second" }),

	// Calendar components
	"سال شمسی": expression(({ jalali }) => jalali.jy),
	"نام ماه شمسی": expression(
		({ jalali, outputLanguage }) => JALALI_MONTHS_NAME[outputLanguage][jalali.jm],
	),
	"شماره ماه شمسی": expression(({ jalali }) => pad2(jalali.jm)),
	"روز ماه شمسی": expression(({ jalali }) => pad2(jalali.jd)),
	"سال میلادی": expression(({ now }) => now.year),
	"نام ماه میلادی": expression(gregorianMonthName),
	"شماره ماه میلادی": expression(({ now }) => pad2(now.month)),
	"روز ماه میلادی": expression(({ now }) => pad2(now.day)),
	"سال قمری": expression(({ hijri }) => hijri.hy),
	"نام ماه قمری": expression(hijriMonthName),
	"شماره ماه قمری": expression(({ hijri }) => pad2(hijri.hm)),
	"روز ماه قمری": expression(({ hijri }) => pad2(hijri.hd)),
	"نام روز": expression(({ weekday, outputLanguage }) => WEEKDAYS_NAME[outputLanguage][weekday]),
	"شماره روز هفته": expression(({ weekday }) => weekday),

	// Calendar calculations
	"تعداد روز سال شمسی": expression(({ daysInYear }) => daysInYear),
	"تعداد روز ماه شمسی": expression(({ daysInMonth }) => daysInMonth),
	"روز سال شمسی": expression(({ dayOfYear }) => dayOfYear),
	"هفته سال": expression(({ weekNumber }) => weekNumber),
	"هفته ماه شمسی": expression(({ jalali }) => Math.ceil(jalali.jd / 7)),
	فصل: expression(({ season, outputLanguage }) => SEASONS_NAME[outputLanguage][season]),
	"شماره فصل": expression(({ season }) => season),
	"روز فصل": expression(({ date }) => dateToDaysPassedSeason(date)),
	"روز باقی سال شمسی": expression(({ daysLeftInYear }) => daysLeftInYear),
	"روز باقی ماه شمسی": expression(({ daysLeftInMonth }) => daysLeftInMonth),
	"روز باقی فصل": expression(({ date }) => dateToDaysRemainingSeason(date)),
	"روز باقی هفته": expression(({ weekday }) => 7 - weekday),
	"دقیقه مانده روز": expression(({ minutesLeft }) => minutesLeft, { cadence: "minute" }),
	"دقیقه گذشته روز": expression(({ minutesElapsed }) => minutesElapsed, { cadence: "minute" }),

	// Progress and events
	"درصد سال شمسی": expression(percent(elapsedFractions.year)),
	"درصد فصل": expression(percent(elapsedFractions.season)),
	"درصد ماه شمسی": expression(percent(elapsedFractions.month)),
	"درصد هفته": expression(percent(elapsedFractions.week)),
	"درصد روز": expression(percent(elapsedFractions.day), { cadence: "minute" }),
	مناسبت: expression(
		({ events, outputLanguage }) =>
			events.map((event) => event.title[outputLanguage]).join(" | ") ||
			localizedText[outputLanguage].noEvents,
	),
	"تعداد مناسبت": expression(({ events }) => events.length),
	تعطیل: expression((context) => yesNo(context.isHoliday, context)),
} satisfies Record<string, Expression>;

export const LIVE_EXPRESSION_KEYS = Object.freeze(Object.keys(canonicalExpressions));

const expressionsByKey = new Map<string, Expression>(Object.entries(canonicalExpressions));

export function findExpression(key: string): Expression | undefined {
	return expressionsByKey.get(key);
}
