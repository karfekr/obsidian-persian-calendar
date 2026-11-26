import type { CalendarDate } from "@internationalized/date";
import { JALALI_MONTHS_NAME, SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type {
	TJalali,
	TLocale,
	TNoteNavTarget,
	TPeriodicNoteInfo,
	TWeekCalculationMode,
} from "src/types";
import {
	addCalendarDays,
	dateToJalali,
	getWeekdayTehran,
	getWeekStartCalculator,
	jalaliToCalendarDate,
	jalaliToSeason,
} from "src/utils/dateUtils";
import { toFaNumber } from "src/utils/formatters";

export type TNoteNavSideSlot = {
	kicker?: string;
	main: string;
	target: TNoteNavTarget;
};

export type TNoteNavModel = {
	mode: TNoteNavTarget["mode"];
	locale: TLocale;
	year: string;
	isCurrent: boolean;
	noteTypeLabel: string;
	currentButtonLabel: string;
	prevLabel: string;
	nextLabel: string;
	todayTarget: TNoteNavTarget;
	prev: TNoteNavSideSlot;
	center?: { kicker?: string; main: string };
	next: TNoteNavSideSlot;
};

const EN_WEEKDAYS_SHORT = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function formatNum(value: number, locale: TLocale): string {
	return locale === "fa" ? toFaNumber(value) : String(value);
}

function formatDay({ jm, jd }: TJalali, locale: TLocale): string {
	return `${formatNum(jd, locale)} ${JALALI_MONTHS_NAME[locale][jm]}`;
}

export function buildNoteNavigationModel(
	info: TPeriodicNoteInfo,
	weekCalculation: TWeekCalculationMode,
	today: CalendarDate,
	locale: TLocale = "fa",
): TNoteNavModel {
	const todayJalali = dateToJalali(today);
	const isFa = locale === "fa";
	const common = {
		mode: info.type,
		locale,
		prevLabel: isFa ? "قبلی" : "Previous",
		nextLabel: isFa ? "بعدی" : "Next",
	};

	if (info.type === "daily") {
		const { jy, jm, jd } = info;
		const selectedDate = jalaliToCalendarDate(jy, jm, jd);
		const prevDate = addCalendarDays(selectedDate, -1);
		const nextDate = addCalendarDays(selectedDate, 1);
		const weekday = (date: CalendarDate) => {
			const index = (getWeekdayTehran(date) + 1) % 7;
			return isFa ? WEEKDAYS_NAME.fa[index + 1] : EN_WEEKDAYS_SHORT[index];
		};

		const jp = dateToJalali(prevDate);
		const jn = dateToJalali(nextDate);

		return {
			...common,
			year: formatNum(jy, locale),
			isCurrent: selectedDate.compare(today) === 0,
			noteTypeLabel: isFa ? "روزنوشت" : "Daily Note",
			currentButtonLabel: isFa ? "امروز" : "Today",
			todayTarget: { mode: "daily", ...todayJalali },
			prev: {
				kicker: weekday(prevDate),
				main: formatDay(jp, locale),
				target: { mode: "daily", ...jp },
			},
			center: { kicker: weekday(selectedDate), main: formatDay(info, locale) },
			next: {
				kicker: weekday(nextDate),
				main: formatDay(jn, locale),
				target: { mode: "daily", ...jn },
			},
		};
	}

	if (info.type === "weekly") {
		const { weekYear, weekNumber, anchor: weekStart } = info;
		const calculator = getWeekStartCalculator(weekCalculation);
		const todayWeek = calculator.getWeekNumber(today);
		const weekStartDate = jalaliToCalendarDate(weekStart.jy, weekStart.jm, weekStart.jd);
		const weekEndDate = addCalendarDays(weekStartDate, 6);
		const weekEnd = dateToJalali(weekEndDate);
		const prevWeek = calculator.getWeekNumber(addCalendarDays(weekStartDate, -1));
		// The last day resolves the next week's naming year when its first day is in Esfand.
		const nextWeek = calculator.getWeekNumber(addCalendarDays(weekEndDate, 7));
		const jalaliWeeks = weekCalculation.startsWith("jalali-");
		const weekLabel = (number: number) => (isFa ? `هفته ${toFaNumber(number)}` : `Week ${number}`);
		const endLabel = formatDay(weekEnd, locale);
		const startLabel =
			weekStart.jm === weekEnd.jm ? formatNum(weekStart.jd, locale) : formatDay(weekStart, locale);
		const separator = isFa ? " تا " : weekStart.jm === weekEnd.jm ? "–" : " – ";

		return {
			...common,
			year: formatNum(jalaliWeeks ? weekYear : weekStart.jy, locale),
			isCurrent: weekYear === todayWeek.jy && weekNumber === todayWeek.weekNumber,
			noteTypeLabel: isFa ? "هفته‌نوشت" : "Weekly Note",
			currentButtonLabel: isFa ? "این هفته" : "This Week",
			todayTarget: { mode: "weekly", weekYear: todayWeek.jy, weekNumber: todayWeek.weekNumber },
			prev: {
				main: jalaliWeeks ? weekLabel(prevWeek.weekNumber) : isFa ? "هفته قبل" : "Prev Week",
				target: { mode: "weekly", weekYear: prevWeek.jy, weekNumber: prevWeek.weekNumber },
			},
			center: {
				kicker: jalaliWeeks ? weekLabel(weekNumber) : undefined,
				main: startLabel + separator + endLabel,
			},
			next: {
				main: jalaliWeeks ? weekLabel(nextWeek.weekNumber) : isFa ? "هفته بعد" : "Next Week",
				target: { mode: "weekly", weekYear: nextWeek.jy, weekNumber: nextWeek.weekNumber },
			},
		};
	}

	if (info.type === "monthly") {
		const { jy, jm } = info;
		const pm = jm === 1 ? 12 : jm - 1;
		const py = jm === 1 ? jy - 1 : jy;
		const nm = jm === 12 ? 1 : jm + 1;
		const ny = jm === 12 ? jy + 1 : jy;
		const months = JALALI_MONTHS_NAME[locale];

		return {
			...common,
			year: formatNum(jy, locale),
			isCurrent: jy === todayJalali.jy && jm === todayJalali.jm,
			noteTypeLabel: isFa ? "ماه‌نوشت" : "Monthly Note",
			currentButtonLabel: isFa ? "این ماه" : "This Month",
			todayTarget: { mode: "monthly", jy: todayJalali.jy, jm: todayJalali.jm },
			prev: { main: months[pm], target: { mode: "monthly", jy: py, jm: pm } },
			center: { main: months[jm] },
			next: { main: months[nm], target: { mode: "monthly", jy: ny, jm: nm } },
		};
	}

	if (info.type === "seasonal") {
		const { jy, seasonNumber } = info;
		const currentSeason = jalaliToSeason(todayJalali.jm);
		const prevSeason = seasonNumber === 1 ? 4 : seasonNumber - 1;
		const nextSeason = seasonNumber === 4 ? 1 : seasonNumber + 1;
		const seasons = SEASONS_NAME[locale];

		return {
			...common,
			year: formatNum(jy, locale),
			isCurrent: jy === todayJalali.jy && seasonNumber === currentSeason,
			noteTypeLabel: isFa ? "فصل‌نوشت" : "Seasonal Note",
			currentButtonLabel: isFa ? "این فصل" : "This Season",
			todayTarget: { mode: "seasonal", jy: todayJalali.jy, seasonNumber: currentSeason },
			prev: {
				main: seasons[prevSeason],
				target: {
					mode: "seasonal",
					jy: seasonNumber === 1 ? jy - 1 : jy,
					seasonNumber: prevSeason,
				},
			},
			center: { main: seasons[seasonNumber] },
			next: {
				main: seasons[nextSeason],
				target: {
					mode: "seasonal",
					jy: seasonNumber === 4 ? jy + 1 : jy,
					seasonNumber: nextSeason,
				},
			},
		};
	}

	const { jy } = info;
	return {
		...common,
		year: formatNum(jy, locale),
		isCurrent: jy === todayJalali.jy,
		noteTypeLabel: isFa ? "سال‌نوشت" : "Yearly Note",
		currentButtonLabel: isFa ? "امسال" : "This Year",
		todayTarget: { mode: "yearly", jy: todayJalali.jy },
		prev: { main: formatNum(jy - 1, locale), target: { mode: "yearly", jy: jy - 1 } },
		next: { main: formatNum(jy + 1, locale), target: { mode: "yearly", jy: jy + 1 } },
	};
}
