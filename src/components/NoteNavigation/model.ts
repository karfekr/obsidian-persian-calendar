import type { CalendarDate } from "@internationalized/date";
import {
	GREGORIAN_MONTHS_NAME,
	JALALI_MONTHS_NAME,
	SEASONS_NAME,
	WEEKDAYS_NAME,
} from "src/constants";
import type {
	TGregorian,
	TLocale,
	TNoteNavMode,
	TPeriodicNoteInfo,
	TWeekCalculationMode,
} from "src/types";
import {
	addCalendarDays,
	checkKabiseh,
	dateToJalali,
	getWeekStartCalculator,
	gregorianDayOfWeek,
	jalaliMonthLength,
	jalaliToCalendarDate,
	jalaliToGregorian,
} from "src/utils/dateUtils";
import { toFaNumber } from "src/utils/formatters";

export type TNoteNavTarget =
	| { mode: "daily"; jy: number; jm: number; jd: number }
	| { mode: "weekly"; weekYear: number; weekNumber: number }
	| { mode: "monthly"; jy: number; jm: number }
	| { mode: "yearly"; jy: number };

export type TNoteNavSideSlot = {
	kicker?: string;
	main: string;
	sub?: string;
	target: TNoteNavTarget;
};

export type TNoteNavCenterSlot = {
	kicker: string;
	currentPill?: string;
	main: string;
	subItems: string[];
};

export type TNoteNavStripChip = {
	label: string;
	num?: string;
	title: string;
	active: boolean;
	target: TNoteNavTarget;
};

export type TNoteNavModel = {
	mode: TNoteNavMode;
	locale: TLocale;
	isCurrent: boolean;
	noteTypeLabel: string;
	currentButtonLabel: string;
	prevLabel: string;
	nextLabel: string;
	todayTarget: TNoteNavTarget;
	prev: TNoteNavSideSlot;
	center: TNoteNavCenterSlot;
	next: TNoteNavSideSlot;
	stripChips: TNoteNavStripChip[];
};

const EN_WEEKDAYS_SHORT: Record<number, string> = {
	1: "Sat",
	2: "Sun",
	3: "Mon",
	4: "Tue",
	5: "Wed",
	6: "Thu",
	7: "Fri",
};

const FA_WEEKDAYS_SHORT: Record<number, string> = {
	1: "ش",
	2: "ی",
	3: "د",
	4: "س",
	5: "چ",
	6: "پ",
	7: "ج",
};

const EN_G_MONTHS_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function formatNum(value: number, locale: TLocale): string {
	return locale === "fa" ? toFaNumber(value) : String(value);
}

function formatGDate(g: TGregorian, locale: TLocale): string {
	if (locale === "fa") {
		return `${toFaNumber(g.gd)} ${GREGORIAN_MONTHS_NAME.fa[g.gm]} ${toFaNumber(g.gy)}`;
	}
	return `${EN_G_MONTHS_SHORT[g.gm - 1]} ${g.gd}, ${g.gy}`;
}

function formatGRange(start: TGregorian, end: TGregorian, locale: TLocale): string {
	if (locale === "fa") {
		if (start.gm === end.gm) {
			return `${toFaNumber(start.gd)} تا ${toFaNumber(end.gd)} ${GREGORIAN_MONTHS_NAME.fa[start.gm]}`;
		}
		return `${toFaNumber(start.gd)} ${GREGORIAN_MONTHS_NAME.fa[start.gm]} تا ${toFaNumber(end.gd)} ${GREGORIAN_MONTHS_NAME.fa[end.gm]}`;
	}
	if (start.gm === end.gm) {
		return `${EN_G_MONTHS_SHORT[start.gm - 1]} ${start.gd}–${end.gd}`;
	}
	return `${EN_G_MONTHS_SHORT[start.gm - 1]} ${start.gd} – ${EN_G_MONTHS_SHORT[end.gm - 1]} ${end.gd}`;
}

export function buildNoteNavigationModel(
	info: TPeriodicNoteInfo,
	weekCalculation: TWeekCalculationMode,
	today: CalendarDate,
	locale: TLocale = "fa",
): TNoteNavModel {
	const calculator = getWeekStartCalculator(weekCalculation);
	const todayJalali = dateToJalali(today);
	const todayWeek = calculator.getWeekNumber(today);
	const isFa = locale === "fa";
	const prevLabel = isFa ? "قبلی" : "Previous";
	const nextLabel = isFa ? "بعدی" : "Next";

	if (info.type === "daily") {
		const { jy, jm, jd } = info;
		const selectedDate = jalaliToCalendarDate(jy, jm, jd);
		const prevDate = addCalendarDays(selectedDate, -1);
		const nextDate = addCalendarDays(selectedDate, 1);

		const jp = dateToJalali(prevDate);
		const jn = dateToJalali(nextDate);

		const g = jalaliToGregorian(jy, jm, jd);
		const gp = jalaliToGregorian(jp.jy, jp.jm, jp.jd);
		const gn = jalaliToGregorian(jn.jy, jn.jm, jn.jd);

		const wd = gregorianDayOfWeek(g.gy, g.gm, g.gd);
		const wdp = gregorianDayOfWeek(gp.gy, gp.gm, gp.gd);
		const wdn = gregorianDayOfWeek(gn.gy, gn.gm, gn.gd);

		const wk = calculator.getWeekNumber(selectedDate);
		const isCurrent = jy === todayJalali.jy && jm === todayJalali.jm && jd === todayJalali.jd;
		const currentLabel = isFa ? "امروز" : "Today";

		return {
			mode: "daily",
			locale,
			isCurrent,
			noteTypeLabel: isFa ? "روزنوشت" : "Daily Note",
			currentButtonLabel: currentLabel,
			prevLabel,
			nextLabel,
			todayTarget: { mode: "daily", ...todayJalali },
			prev: {
				kicker: isFa ? WEEKDAYS_NAME.fa[wdp] : EN_WEEKDAYS_SHORT[wdp],
				main: formatNum(jp.jd, locale),
				sub: JALALI_MONTHS_NAME[locale][jp.jm],
				target: { mode: "daily", jy: jp.jy, jm: jp.jm, jd: jp.jd },
			},
			center: {
				kicker: isFa ? WEEKDAYS_NAME.fa[wd] : EN_WEEKDAYS_SHORT[wd],
				currentPill: isCurrent ? currentLabel : undefined,
				main: `${formatNum(jd, locale)} ${JALALI_MONTHS_NAME[locale][jm]}`,
				subItems: [
					formatNum(jy, locale),
					isFa ? `هفته ${toFaNumber(wk.weekNumber)}` : `W${wk.weekNumber}`,
					formatGDate(g, locale),
				],
			},
			next: {
				kicker: isFa ? WEEKDAYS_NAME.fa[wdn] : EN_WEEKDAYS_SHORT[wdn],
				main: formatNum(jn.jd, locale),
				sub: JALALI_MONTHS_NAME[locale][jn.jm],
				target: { mode: "daily", jy: jn.jy, jm: jn.jm, jd: jn.jd },
			},
			stripChips: [],
		};
	}

	if (info.type === "weekly") {
		const { weekYear, weekNumber } = info;
		const weekStart = calculator.getStartOfWeek(weekYear, weekNumber);
		const weekEnd = calculator.getEndOfWeek(weekYear, weekNumber);
		const weekStartDate = jalaliToCalendarDate(weekStart.jy, weekStart.jm, weekStart.jd);

		const prevWeek = calculator.getWeekNumber(addCalendarDays(weekStartDate, -7));
		const nextWeek = calculator.getWeekNumber(addCalendarDays(weekStartDate, 7));

		const isCurrent = weekYear === todayWeek.jy && weekNumber === todayWeek.weekNumber;
		const currentLabel = isFa ? "این هفته" : "This Week";

		const main = isFa
			? weekStart.jm === weekEnd.jm
				? `${toFaNumber(weekStart.jd)} تا ${toFaNumber(weekEnd.jd)} ${JALALI_MONTHS_NAME.fa[weekEnd.jm]}`
				: `${toFaNumber(weekStart.jd)} ${JALALI_MONTHS_NAME.fa[weekStart.jm]} تا ${toFaNumber(weekEnd.jd)} ${JALALI_MONTHS_NAME.fa[weekEnd.jm]}`
			: weekStart.jm === weekEnd.jm
				? `${weekStart.jd}–${weekEnd.jd} ${JALALI_MONTHS_NAME.en[weekStart.jm]}`
				: `${weekStart.jd} ${JALALI_MONTHS_NAME.en[weekStart.jm]} – ${weekEnd.jd} ${JALALI_MONTHS_NAME.en[weekEnd.jm]}`;

		const stripChips: TNoteNavStripChip[] = Array.from({ length: 7 }, (_, i) => {
			const dDate = addCalendarDays(weekStartDate, i);
			const dj = dateToJalali(dDate);
			const dg = jalaliToGregorian(dj.jy, dj.jm, dj.jd);
			const dWd = gregorianDayOfWeek(dg.gy, dg.gm, dg.gd);
			const isTodayChip =
				dj.jy === todayJalali.jy && dj.jm === todayJalali.jm && dj.jd === todayJalali.jd;

			return {
				label: isFa ? FA_WEEKDAYS_SHORT[dWd] : EN_WEEKDAYS_SHORT[dWd],
				num: formatNum(dj.jd, locale),
				title: isFa
					? `${WEEKDAYS_NAME.fa[dWd]} ${toFaNumber(dj.jd)} ${JALALI_MONTHS_NAME.fa[dj.jm]}`
					: `${EN_WEEKDAYS_SHORT[dWd]} ${dj.jd} ${JALALI_MONTHS_NAME.en[dj.jm]}`,
				active: isTodayChip,
				target: { mode: "daily", jy: dj.jy, jm: dj.jm, jd: dj.jd },
			};
		});

		return {
			mode: "weekly",
			locale,
			isCurrent,
			noteTypeLabel: isFa ? "هفته‌نوشت" : "Weekly Note",
			currentButtonLabel: currentLabel,
			prevLabel,
			nextLabel,
			todayTarget: { mode: "weekly", weekYear: todayWeek.jy, weekNumber: todayWeek.weekNumber },
			prev: {
				kicker: isFa ? "هفته قبل" : "Prev Week",
				main: isFa ? `هفته ${toFaNumber(prevWeek.weekNumber)}` : `W${prevWeek.weekNumber}`,
				sub: formatNum(prevWeek.jy, locale),
				target: { mode: "weekly", weekYear: prevWeek.jy, weekNumber: prevWeek.weekNumber },
			},
			center: {
				kicker: isFa ? `هفته ${toFaNumber(weekNumber)}` : `Week ${weekNumber}`,
				currentPill: isCurrent ? currentLabel : undefined,
				main,
				subItems: [formatNum(weekStart.jy, locale), formatGRange(weekStart, weekEnd, locale)],
			},
			next: {
				kicker: isFa ? "هفته بعد" : "Next Week",
				main: isFa ? `هفته ${toFaNumber(nextWeek.weekNumber)}` : `W${nextWeek.weekNumber}`,
				sub: formatNum(nextWeek.jy, locale),
				target: { mode: "weekly", weekYear: nextWeek.jy, weekNumber: nextWeek.weekNumber },
			},
			stripChips,
		};
	}

	if (info.type === "monthly") {
		const { jy, jm } = info;
		const pm = jm === 1 ? 12 : jm - 1;
		const py = jm === 1 ? jy - 1 : jy;
		const nm = jm === 12 ? 1 : jm + 1;
		const ny = jm === 12 ? jy + 1 : jy;

		const daysInMonth = jalaliMonthLength(jy, jm);
		const mStartG = jalaliToGregorian(jy, jm, 1);
		const mEndG = jalaliToGregorian(jy, jm, daysInMonth);
		const gSpan = isFa
			? `${GREGORIAN_MONTHS_NAME.fa[mStartG.gm]} – ${GREGORIAN_MONTHS_NAME.fa[mEndG.gm]} ${toFaNumber(mEndG.gy)}`
			: `${EN_G_MONTHS_SHORT[mStartG.gm - 1]} – ${EN_G_MONTHS_SHORT[mEndG.gm - 1]} ${mEndG.gy}`;

		const isCurrent = jy === todayJalali.jy && jm === todayJalali.jm;
		const currentLabel = isFa ? "این ماه" : "This Month";

		const stripChips: TNoteNavStripChip[] = Array.from({ length: 12 }, (_, idx) => {
			const mNum = idx + 1;
			const name = JALALI_MONTHS_NAME[locale][mNum];
			return {
				label: name,
				title: name,
				active: mNum === jm,
				target: { mode: "monthly", jy, jm: mNum },
			};
		});

		return {
			mode: "monthly",
			locale,
			isCurrent,
			noteTypeLabel: isFa ? "ماه‌نوشت" : "Monthly Note",
			currentButtonLabel: currentLabel,
			prevLabel,
			nextLabel,
			todayTarget: { mode: "monthly", jy: todayJalali.jy, jm: todayJalali.jm },
			prev: {
				kicker: formatNum(py, locale),
				main: JALALI_MONTHS_NAME[locale][pm],
				target: { mode: "monthly", jy: py, jm: pm },
			},
			center: {
				kicker: isFa ? toFaNumber(jy) : `${jy} SH`,
				currentPill: isCurrent ? currentLabel : undefined,
				main: JALALI_MONTHS_NAME[locale][jm],
				subItems: [isFa ? `${toFaNumber(daysInMonth)} روز` : `${daysInMonth} days`, gSpan],
			},
			next: {
				kicker: formatNum(ny, locale),
				main: JALALI_MONTHS_NAME[locale][nm],
				target: { mode: "monthly", jy: ny, jm: nm },
			},
			stripChips,
		};
	}

	// Yearly
	const { jy } = info;
	const py = jy - 1;
	const ny = jy + 1;
	const isLeap = checkKabiseh(jy);
	const yStartG = jalaliToGregorian(jy, 1, 1);
	const yEndG = jalaliToGregorian(jy, 12, jalaliMonthLength(jy, 12));
	const isCurrent = jy === todayJalali.jy;
	const currentLabel = isFa ? "امسال" : "This Year";
	const currentSeason = Math.floor((todayJalali.jm - 1) / 3) + 1;

	const stripChips: TNoteNavStripChip[] = [1, 2, 3, 4].map((seasonNum) => {
		const name = SEASONS_NAME[locale][seasonNum];
		return {
			label: name,
			title: name,
			active: isCurrent && seasonNum === currentSeason,
			target: { mode: "monthly", jy, jm: (seasonNum - 1) * 3 + 1 },
		};
	});

	return {
		mode: "yearly",
		locale,
		isCurrent,
		noteTypeLabel: isFa ? "سال‌نوشت" : "Yearly Note",
		currentButtonLabel: currentLabel,
		prevLabel,
		nextLabel,
		todayTarget: { mode: "yearly", jy: todayJalali.jy },
		prev: {
			kicker: isFa ? "سال قبل" : "Prev Year",
			main: formatNum(py, locale),
			sub: `${formatNum(yStartG.gy - 1, locale)}–${formatNum(yEndG.gy - 1, locale)}`,
			target: { mode: "yearly", jy: py },
		},
		center: {
			kicker: isFa ? "سال هجری شمسی" : "Solar Hijri Year",
			currentPill: isCurrent ? currentLabel : undefined,
			main: formatNum(jy, locale),
			subItems: [
				`${formatNum(yStartG.gy, locale)} – ${formatNum(yEndG.gy, locale)}`,
				isLeap ? (isFa ? "کبیسه" : "Leap Year") : isFa ? "۳۶۵ روز" : "365 days",
			],
		},
		next: {
			kicker: isFa ? "سال بعد" : "Next Year",
			main: formatNum(ny, locale),
			sub: `${formatNum(yStartG.gy + 1, locale)}–${formatNum(yEndG.gy + 1, locale)}`,
			target: { mode: "yearly", jy: ny },
		},
		stripChips,
	};
}
