import type { CalendarDate } from "@internationalized/date";
import { JALALI_MONTHS_NAME, SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TGregorian, TNoteNavMode, TPeriodicNoteInfo, TWeekCalculationMode } from "src/types";
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
	kickerEn?: string;
	kickerFa?: string;
	mainEn?: string;
	mainFa?: string;
	mainIsFaPrimary?: boolean;
	subEn?: string;
	subFa?: string;
	target: TNoteNavTarget;
};

export type TNoteNavCenterSlot = {
	kickerEn: string;
	kickerFa?: string;
	currentPillEn?: string;
	currentPillFa?: string;
	mainNum?: string;
	mainNumIsSecondary?: boolean;
	mainFa?: string;
	mainFaSize?: "default" | "week" | "month";
	mainOrder?: "num-first" | "fa-first";
	subItems: string[];
};

export type TNoteNavStripChip = {
	en?: string;
	fa?: string;
	num?: string;
	title?: string;
	active: boolean;
	target: TNoteNavTarget;
};

export type TNoteNavModel = {
	mode: TNoteNavMode;
	isCurrent: boolean;
	todayTarget: TNoteNavTarget;
	modeTargets: Record<TNoteNavMode, TNoteNavTarget>;
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

function formatGShort(g: TGregorian): string {
	return `${EN_G_MONTHS_SHORT[g.gm - 1]} ${g.gd}, ${g.gy}`;
}

export function buildNoteNavigationModel(
	info: TPeriodicNoteInfo,
	weekCalculation: TWeekCalculationMode,
	today: CalendarDate,
): TNoteNavModel {
	const calculator = getWeekStartCalculator(weekCalculation);
	const todayJalali = dateToJalali(today);
	const todayWeek = calculator.getWeekNumber(today);

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

		return {
			mode: "daily",
			isCurrent,
			todayTarget: { mode: "daily", ...todayJalali },
			modeTargets: {
				daily: { mode: "daily", jy, jm, jd },
				weekly: { mode: "weekly", weekYear: wk.jy, weekNumber: wk.weekNumber },
				monthly: { mode: "monthly", jy, jm },
				yearly: { mode: "yearly", jy },
			},
			prev: {
				kickerEn: EN_WEEKDAYS_SHORT[wdp],
				kickerFa: WEEKDAYS_NAME.fa[wdp],
				mainEn: String(jp.jd),
				mainFa: toFaNumber(jp.jd),
				subEn: JALALI_MONTHS_NAME.en[jp.jm],
				subFa: JALALI_MONTHS_NAME.fa[jp.jm],
				target: { mode: "daily", jy: jp.jy, jm: jp.jm, jd: jp.jd },
			},
			center: {
				kickerEn: EN_WEEKDAYS_SHORT[wd],
				kickerFa: WEEKDAYS_NAME.fa[wd],
				currentPillEn: isCurrent ? "Today" : undefined,
				currentPillFa: isCurrent ? "امروز" : undefined,
				mainNum: String(jd),
				mainFa: `${toFaNumber(jd)} ${JALALI_MONTHS_NAME.fa[jm]}`,
				mainOrder: "num-first",
				subItems: [`${JALALI_MONTHS_NAME.en[jm]} ${jy}`, `W${wk.weekNumber}`, formatGShort(g)],
			},
			next: {
				kickerEn: EN_WEEKDAYS_SHORT[wdn],
				kickerFa: WEEKDAYS_NAME.fa[wdn],
				mainEn: String(jn.jd),
				mainFa: toFaNumber(jn.jd),
				subEn: JALALI_MONTHS_NAME.en[jn.jm],
				subFa: JALALI_MONTHS_NAME.fa[jn.jm],
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

		const rangeEn =
			weekStart.jm === weekEnd.jm
				? `${weekStart.jd}–${weekEnd.jd} ${JALALI_MONTHS_NAME.en[weekStart.jm]} ${weekStart.jy}`
				: `${weekStart.jd} ${JALALI_MONTHS_NAME.en[weekStart.jm]} – ${weekEnd.jd} ${JALALI_MONTHS_NAME.en[weekEnd.jm]}`;

		const rangeG =
			weekStart.gm === weekEnd.gm
				? `${EN_G_MONTHS_SHORT[weekStart.gm - 1]} ${weekStart.gd}–${weekEnd.gd}`
				: `${EN_G_MONTHS_SHORT[weekStart.gm - 1]} ${weekStart.gd} – ${EN_G_MONTHS_SHORT[weekEnd.gm - 1]} ${weekEnd.gd}`;

		const mainFa =
			weekStart.jm === weekEnd.jm
				? `${toFaNumber(weekStart.jd)} تا ${toFaNumber(weekEnd.jd)} ${JALALI_MONTHS_NAME.fa[weekEnd.jm]}`
				: `${toFaNumber(weekStart.jd)} ${JALALI_MONTHS_NAME.fa[weekStart.jm]} تا ${toFaNumber(weekEnd.jd)} ${JALALI_MONTHS_NAME.fa[weekEnd.jm]}`;

		const stripChips: TNoteNavStripChip[] = Array.from({ length: 7 }, (_, i) => {
			const dDate = addCalendarDays(weekStartDate, i);
			const dj = dateToJalali(dDate);
			const dg = jalaliToGregorian(dj.jy, dj.jm, dj.jd);
			const dWd = gregorianDayOfWeek(dg.gy, dg.gm, dg.gd);
			const isTodayChip =
				dj.jy === todayJalali.jy && dj.jm === todayJalali.jm && dj.jd === todayJalali.jd;

			return {
				fa: FA_WEEKDAYS_SHORT[dWd],
				num: toFaNumber(dj.jd),
				title: `${EN_WEEKDAYS_SHORT[dWd]} ${dj.jd} ${JALALI_MONTHS_NAME.en[dj.jm]}`,
				active: isTodayChip,
				target: { mode: "daily", jy: dj.jy, jm: dj.jm, jd: dj.jd },
			};
		});

		return {
			mode: "weekly",
			isCurrent,
			todayTarget: { mode: "weekly", weekYear: todayWeek.jy, weekNumber: todayWeek.weekNumber },
			modeTargets: {
				daily: isCurrent
					? { mode: "daily", ...todayJalali }
					: { mode: "daily", jy: weekStart.jy, jm: weekStart.jm, jd: weekStart.jd },
				weekly: { mode: "weekly", weekYear, weekNumber },
				monthly: isCurrent
					? { mode: "monthly", jy: todayJalali.jy, jm: todayJalali.jm }
					: { mode: "monthly", jy: weekStart.jy, jm: weekStart.jm },
				yearly: isCurrent
					? { mode: "yearly", jy: todayJalali.jy }
					: { mode: "yearly", jy: weekStart.jy },
			},
			prev: {
				kickerEn: "Prev Week",
				kickerFa: "هفته قبل",
				mainEn: `W${prevWeek.weekNumber}`,
				subFa: `هفته ${toFaNumber(prevWeek.weekNumber)}`,
				target: { mode: "weekly", weekYear: prevWeek.jy, weekNumber: prevWeek.weekNumber },
			},
			center: {
				kickerEn: `Week ${weekNumber}`,
				kickerFa: `هفته ${toFaNumber(weekNumber)}`,
				currentPillEn: isCurrent ? "This Week" : undefined,
				currentPillFa: isCurrent ? "این هفته" : undefined,
				mainFa,
				mainFaSize: "week",
				subItems: [rangeEn, rangeG],
			},
			next: {
				kickerEn: "Next Week",
				kickerFa: "هفته بعد",
				mainEn: `W${nextWeek.weekNumber}`,
				subFa: `هفته ${toFaNumber(nextWeek.weekNumber)}`,
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
		const gSpan = `${EN_G_MONTHS_SHORT[mStartG.gm - 1]} – ${EN_G_MONTHS_SHORT[mEndG.gm - 1]} ${mEndG.gy}`;

		const isCurrent = jy === todayJalali.jy && jm === todayJalali.jm;
		const firstDayWeek = calculator.getWeekNumber(jalaliToCalendarDate(jy, jm, 1));

		const stripChips: TNoteNavStripChip[] = Array.from({ length: 12 }, (_, idx) => {
			const mNum = idx + 1;
			return {
				fa: JALALI_MONTHS_NAME.fa[mNum],
				title: JALALI_MONTHS_NAME.en[mNum],
				active: mNum === jm,
				target: { mode: "monthly", jy, jm: mNum },
			};
		});

		return {
			mode: "monthly",
			isCurrent,
			todayTarget: { mode: "monthly", jy: todayJalali.jy, jm: todayJalali.jm },
			modeTargets: {
				daily: isCurrent ? { mode: "daily", ...todayJalali } : { mode: "daily", jy, jm, jd: 1 },
				weekly: isCurrent
					? { mode: "weekly", weekYear: todayWeek.jy, weekNumber: todayWeek.weekNumber }
					: { mode: "weekly", weekYear: firstDayWeek.jy, weekNumber: firstDayWeek.weekNumber },
				monthly: { mode: "monthly", jy, jm },
				yearly: { mode: "yearly", jy },
			},
			prev: {
				kickerEn: String(py),
				mainFa: JALALI_MONTHS_NAME.fa[pm],
				mainIsFaPrimary: true,
				subEn: JALALI_MONTHS_NAME.en[pm],
				target: { mode: "monthly", jy: py, jm: pm },
			},
			center: {
				kickerEn: `${jy} SH`,
				kickerFa: toFaNumber(jy),
				currentPillEn: isCurrent ? "This Month" : undefined,
				currentPillFa: isCurrent ? "این ماه" : undefined,
				mainFa: JALALI_MONTHS_NAME.fa[jm],
				mainFaSize: "month",
				mainNum: JALALI_MONTHS_NAME.en[jm],
				mainNumIsSecondary: true,
				mainOrder: "fa-first",
				subItems: [`${daysInMonth} days`, gSpan],
			},
			next: {
				kickerEn: String(ny),
				mainFa: JALALI_MONTHS_NAME.fa[nm],
				mainIsFaPrimary: true,
				subEn: JALALI_MONTHS_NAME.en[nm],
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
	const firstDayWeek = calculator.getWeekNumber(jalaliToCalendarDate(jy, 1, 1));
	const currentSeason = Math.floor((todayJalali.jm - 1) / 3) + 1;

	const stripChips: TNoteNavStripChip[] = [1, 2, 3, 4].map((seasonNum) => ({
		en: SEASONS_NAME.en[seasonNum],
		fa: SEASONS_NAME.fa[seasonNum],
		active: isCurrent && seasonNum === currentSeason,
		target: { mode: "monthly", jy, jm: (seasonNum - 1) * 3 + 1 },
	}));

	return {
		mode: "yearly",
		isCurrent,
		todayTarget: { mode: "yearly", jy: todayJalali.jy },
		modeTargets: {
			daily: isCurrent ? { mode: "daily", ...todayJalali } : { mode: "daily", jy, jm: 1, jd: 1 },
			weekly: isCurrent
				? { mode: "weekly", weekYear: todayWeek.jy, weekNumber: todayWeek.weekNumber }
				: { mode: "weekly", weekYear: firstDayWeek.jy, weekNumber: firstDayWeek.weekNumber },
			monthly: isCurrent
				? { mode: "monthly", jy: todayJalali.jy, jm: todayJalali.jm }
				: { mode: "monthly", jy, jm: 1 },
			yearly: { mode: "yearly", jy },
		},
		prev: {
			kickerEn: "Prev Year",
			mainEn: String(py),
			mainFa: toFaNumber(py),
			subEn: `${yStartG.gy - 1}–${yEndG.gy - 1}`,
			target: { mode: "yearly", jy: py },
		},
		center: {
			kickerEn: "Solar Hijri Year",
			currentPillEn: isCurrent ? "This Year" : undefined,
			currentPillFa: isCurrent ? "امسال" : undefined,
			mainNum: String(jy),
			mainFa: toFaNumber(jy),
			mainOrder: "num-first",
			subItems: [`${yStartG.gy} – ${yEndG.gy}`, isLeap ? "Leap · کبیسه" : "365 days"],
		},
		next: {
			kickerEn: "Next Year",
			mainEn: String(ny),
			mainFa: toFaNumber(ny),
			subEn: `${yStartG.gy + 1}–${yEndG.gy + 1}`,
			target: { mode: "yearly", jy: ny },
		},
		stripChips,
	};
}
