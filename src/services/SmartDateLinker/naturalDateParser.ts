import type { CalendarDate } from "@internationalized/date";
import { GregorianCalendar, PersianCalendar, toCalendar } from "@internationalized/date";
import { JALALI_MONTHS_NAME } from "src/constants";
import {
	checkValidJalali,
	dateToJalali,
	getWeekdayTehran,
	gregorianToCalendarDate,
	jalaliMonthLength,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { toEnNumber, toFaNumber } from "src/utils/formatters";

const persianCalendar = new PersianCalendar();
const gregorianCalendar = new GregorianCalendar();

const CARDINAL_UNITS: Record<string, number> = {
	یک: 1,
	دو: 2,
	سه: 3,
	چهار: 4,
	پنج: 5,
	شش: 6,
	شیش: 6,
	هفت: 7,
	هشت: 8,
	نه: 9,
	ده: 10,
	یازده: 11,
	دوازده: 12,
	سیزده: 13,
	چهارده: 14,
	پانزده: 15,
	پونزده: 15,
	شانزده: 16,
	شونزده: 16,
	هفده: 17,
	هیفده: 17,
	هجده: 18,
	هیجده: 18,
	نوزده: 19,
};

const CARDINAL_TENS: Record<string, number> = {
	بیست: 20,
	سی: 30,
	چهل: 40,
	پنجاه: 50,
	شصت: 60,
	هفتاد: 70,
	هشتاد: 80,
	نود: 90,
	صد: 100,
	یکصد: 100,
};

const ORDINAL_SINGLE: Record<string, number> = {
	اول: 1,
	یکم: 1,
	دوم: 2,
	سوم: 3,
	چهارم: 4,
	پنجم: 5,
	ششم: 6,
	شیشم: 6,
	هفتم: 7,
	هشتم: 8,
	نهم: 9,
	دهم: 10,
	یازدهم: 11,
	دوازدهم: 12,
	سیزدهم: 13,
	چهاردهم: 14,
	پانزدهم: 15,
	پونزدهم: 15,
	شانزدهم: 16,
	شونزدهم: 16,
	هفدهم: 17,
	هیفدهم: 17,
	هجدهم: 18,
	هیجدهم: 18,
	نوزدهم: 19,
	بیستم: 20,
	"سی ام": 30,
	سیام: 30,
};

const JALALI_MONTH_ALIASES: Record<string, number> = {
	فروردین: 1,
	اردیبهشت: 2,
	خرداد: 3,
	تیر: 4,
	مرداد: 5,
	امرداد: 5,
	شهریور: 6,
	مهر: 7,
	آبان: 8,
	ابان: 8,
	آذر: 9,
	اذر: 9,
	دی: 10,
	بهمن: 11,
	اسفند: 12,
	اسپند: 12,
};

const WEEKDAY_ALIASES: Record<string, number> = {
	شنبه: 1,
	یکشنبه: 2,
	"یک شنبه": 2,
	دوشنبه: 3,
	"دو شنبه": 3,
	"سه شنبه": 4,
	چهارشنبه: 5,
	"چهار شنبه": 5,
	"پنج شنبه": 6,
	جمعه: 7,
};

const FIXED_DAY_OFFSETS: Record<string, number> = {
	امروز: 0,
	فردا: 1,
	دیروز: -1,
	پریروز: -2,
	"پس فردا": 2,
	"روز بعد": 1,
	"روز آینده": 1,
	"روز قبل": -1,
	"روز گذشته": -1,
	"روز پیش": -1,
};

/**
 * Normalizes Persian text by converting digits to ASCII, unifying Arabic/Persian
 * characters, and replacing ZWNJ + multiple whitespaces with a single space.
 */
export function normalizePersianQuery(input: string): string {
	return toEnNumber(input)
		.replace(/ي|ى/g, "ی")
		.replace(/ك/g, "ک")
		.replace(/ة/g, "ه")
		.replace(/أ|إ/g, "ا")
		.replace(/\u200c+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Parses a Persian number expression (digits, cardinal words, or ordinal words).
 */
export function parsePersianNumber(raw: string): number | null {
	const cleaned = normalizePersianQuery(raw);
	if (!cleaned) return null;

	// Direct digits or digits with ordinal suffix (e.g. "15", "15ام", "15 ام", "15م", "2وم")
	const numericMatch = cleaned.match(/^(\d+)\s*(?:ام|وم|م)?$/);
	if (numericMatch) {
		const val = Number(numericMatch[1]);
		return Number.isFinite(val) && val > 0 ? val : null;
	}

	if (cleaned in ORDINAL_SINGLE) {
		return ORDINAL_SINGLE[cleaned];
	}

	if (cleaned in CARDINAL_UNITS) {
		return CARDINAL_UNITS[cleaned];
	}

	if (cleaned in CARDINAL_TENS) {
		return CARDINAL_TENS[cleaned];
	}

	// Compound tens + unit (e.g., "بیست و یک", "بیست و یکم", "سی و یکم")
	const compoundMatch = cleaned.match(/^(بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود)\s+و\s+(.+)$/);
	if (compoundMatch) {
		const tens = CARDINAL_TENS[compoundMatch[1]];
		const rest = compoundMatch[2];
		const unit = ORDINAL_SINGLE[rest] ?? CARDINAL_UNITS[rest];
		if (tens !== undefined && unit !== undefined && unit >= 1 && unit <= 9) {
			return tens + unit;
		}
	}

	return null;
}

function resolveYearToken(rawYear: string | undefined, baseJy: number): number | null {
	if (!rawYear) return baseJy;

	const cleaned = rawYear.replace(/^سال\s+/, "").trim();
	if (!cleaned || cleaned === "امسال" || cleaned === "جاری") {
		return baseJy;
	}
	if (cleaned === "بعد" || cleaned === "آینده") {
		return baseJy + 1;
	}
	if (cleaned === "قبل" || cleaned === "گذشته" || cleaned === "پیش") {
		return baseJy - 1;
	}

	if (/^\d{4}$/.test(cleaned)) {
		const jy = Number(cleaned);
		return jy >= 1000 && jy <= 1999 ? jy : null;
	}

	if (/^\d{2}$/.test(cleaned)) {
		const twoDigit = Number(cleaned);
		return twoDigit >= 80 ? 1300 + twoDigit : 1400 + twoDigit;
	}

	return null;
}

function addJalaliMonthsOrYears(base: CalendarDate, months = 0, years = 0): CalendarDate {
	let pDate = toCalendar(base, persianCalendar);
	if (months !== 0) {
		pDate = pDate.add({ months });
	}
	if (years !== 0) {
		pDate = pDate.add({ years });
	}
	return toCalendar(pDate, gregorianCalendar);
}

/**
 * Attempts to parse a Persian natural-language date expression into a target CalendarDate.
 * Returns null if the expression does not match any valid natural date pattern.
 */
export function parseNaturalPersianDate(
	rawKeyword: string,
	now: CalendarDate,
): CalendarDate | null {
	const normalized = normalizePersianQuery(rawKeyword);
	if (!normalized) return null;

	// 1. Fixed relative day expressions (امروز، فردا، دیروز، پریروز، پس‌فردا، روز بعد، روز قبل)
	if (normalized in FIXED_DAY_OFFSETS) {
		return now.add({ days: FIXED_DAY_OFFSETS[normalized] });
	}

	// 2. Numeric formatted dates (e.g. ۱۴۰۶/۰۱/۰۱ or 1406-01-01)
	const slashOrDashMatch = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
	if (slashOrDashMatch) {
		const y = Number(slashOrDashMatch[1]);
		const m = Number(slashOrDashMatch[2]);
		const d = Number(slashOrDashMatch[3]);
		if (y >= 1200 && y < 1700 && checkValidJalali(y, m, d)) {
			return jalaliToCalendarDate(y, m, d);
		}
		if (y >= 1800 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
			const gDate = gregorianToCalendarDate(y, m, d);
			if (gDate.month === m && gDate.day === d) {
				return gDate;
			}
		}
		return null;
	}

	// 3. Weekday expressions: [این|روز] <weekday> [بعد|آینده|قبل|گذشته|پیش|این هفته|هفته بعد|هفته قبل]
	const weekdayNamesPattern = Object.keys(WEEKDAY_ALIASES)
		.sort((a, b) => b.length - a.length)
		.join("|");
	const weekdayRegex = new RegExp(
		`^(?:(?:این|روز)\\s+)?(${weekdayNamesPattern})(?:\\s+(بعد|آینده|قبل|گذشته|پیش|این هفته|هفته بعد|هفته آینده|هفته قبل|هفته گذشته|هفته پیش))?$`,
	);
	const weekdayMatch = normalized.match(weekdayRegex);
	if (weekdayMatch) {
		const [, weekdayKey, modifier = ""] = weekdayMatch;
		const weekdayIndex = WEEKDAY_ALIASES[weekdayKey];
		if (!weekdayIndex) return null;

		const todayIndex = getWeekdayTehran(now) === 6 ? 1 : getWeekdayTehran(now) + 2;
		const daysOffset = (weekdayIndex - todayIndex + 7) % 7;

		let extraWeeks = 0;
		if (modifier.includes("بعد") || modifier.includes("آینده")) {
			extraWeeks = 7;
		} else if (modifier.includes("قبل") || modifier.includes("گذشته") || modifier.includes("پیش")) {
			extraWeeks = -7;
		}

		return now.add({ days: daysOffset + extraWeeks });
	}

	// 4. Relative offsets: "<number> <روز|هفته|ماه|سال> <قبل|پیش|گذشته|بعد|آینده|دیگر|دیگه>"
	const relativeMatch = normalized.match(
		/^(.+?)\s+(روز|هفته|ماه|سال)\s+(قبل|پیش|گذشته|بعد|آینده|دیگر|دیگه)$/,
	);
	if (relativeMatch) {
		const [, rawCount, unit, direction] = relativeMatch;
		const count = parsePersianNumber(rawCount);
		if (count !== null && count > 0) {
			const sign = direction === "قبل" || direction === "پیش" || direction === "گذشته" ? -1 : 1;
			if (unit === "روز") {
				return now.add({ days: sign * count });
			}
			if (unit === "هفته") {
				return now.add({ days: sign * count * 7 });
			}
			if (unit === "ماه") {
				return addJalaliMonthsOrYears(now, sign * count, 0);
			}
			if (unit === "سال") {
				return addJalaliMonthsOrYears(now, 0, sign * count);
			}
		}
	}

	// 5. Explicit Jalali date: "<day|آخر> <monthName> [ماه] [<year|سال بعد|سال قبل|امسال>]"
	const monthNamesPattern = Object.keys(JALALI_MONTH_ALIASES)
		.sort((a, b) => b.length - a.length)
		.join("|");
	const explicitDateRegex = new RegExp(
		`^(?:روز\\s+)?(.+?)\\s+(${monthNamesPattern})(?:\\s+ماه)?(?:\\s+(.+))?$`,
	);
	const explicitMatch = normalized.match(explicitDateRegex);
	if (explicitMatch) {
		const [, rawDay, monthKey, rawYear] = explicitMatch;
		const jm = JALALI_MONTH_ALIASES[monthKey];
		if (!jm) return null;

		const { jy: todayJy } = dateToJalali(now);
		const jy = resolveYearToken(rawYear, todayJy);
		if (jy === null || jy < 1) return null;

		let jd: number | null = null;
		if (rawDay === "آخر" || rawDay === "اخر" || rawDay === "انتهای" || rawDay === "پایان") {
			jd = jalaliMonthLength(jy, jm);
		} else if (rawDay === "ابتدای" || rawDay === "آغاز") {
			jd = 1;
		} else {
			jd = parsePersianNumber(rawDay);
		}

		if (jd === null || !checkValidJalali(jy, jm, jd)) {
			return null;
		}

		return jalaliToCalendarDate(jy, jm, jd);
	}

	return null;
}

/**
 * Generates contextual autocomplete suggestions for natural-language Persian date queries.
 */
export function getNaturalDateSuggestions(rawQuery: string, now: CalendarDate): string[] {
	const trimmed = rawQuery.trim();
	if (!trimmed) return [];

	const suggestions: string[] = [];
	const addSuggestion = (item: string) => {
		if (!suggestions.includes(item)) {
			suggestions.push(item);
		}
	};

	// If the current query is already a valid natural date expression, put it first
	if (parseNaturalPersianDate(trimmed, now) !== null) {
		addSuggestion(trimmed);
	}

	const normalized = normalizePersianQuery(trimmed);
	const faMonths = Object.values(JALALI_MONTHS_NAME.fa);

	// Partial day + optional partial month (e.g. "۱۵", "۱۵ به", "اول", "اول فر", "آخر اس")
	const dayPrefixMatch = normalized.match(/^(.+?)(?:\s+([^\s]+))?$/);
	if (dayPrefixMatch) {
		const [, firstPart, secondPart = ""] = dayPrefixMatch;
		const isLastKeyword = firstPart === "آخر" || firstPart === "اخر";
		const parsedNumber = parsePersianNumber(firstPart);

		if (isLastKeyword || (parsedNumber !== null && parsedNumber >= 1 && parsedNumber <= 31)) {
			// Preserve the user's original day representation (e.g. Persian digits "۱۵" or word "اول")
			const rawTokens = trimmed.split(/\s+/);
			const displayDay =
				rawTokens.length === 1 || (secondPart && !faMonths.includes(secondPart))
					? rawTokens[0]
					: trimmed.slice(0, trimmed.lastIndexOf(rawTokens[rawTokens.length - 1])).trim() ||
						rawTokens[0];

			for (const monthName of faMonths) {
				if (!secondPart || monthName.startsWith(secondPart)) {
					const candidate = `${displayDay} ${monthName}`;
					if (parseNaturalPersianDate(candidate, now) !== null) {
						addSuggestion(candidate);
					}
				}
			}
		}

		// Relative offset completions when user types a number + optional partial unit (e.g. "۱۰", "۱۰ ر")
		if (parsedNumber !== null && parsedNumber > 0) {
			const rawTokens = trimmed.split(/\s+/);
			const displayNum = rawTokens[0] || toFaNumber(parsedNumber);
			const relativeTemplates = [
				`${displayNum} روز قبل`,
				`${displayNum} روز بعد`,
				`${displayNum} هفته قبل`,
				`${displayNum} هفته بعد`,
				`${displayNum} ماه قبل`,
				`${displayNum} ماه بعد`,
			];
			for (const template of relativeTemplates) {
				if (normalizePersianQuery(template).startsWith(normalized)) {
					addSuggestion(template);
				}
			}
		}
	}

	// Weekday modifier completions (e.g. "سه شنبه", "سه شنبه آ", "جمعه گ")
	const weekdayNamesPattern = Object.keys(WEEKDAY_ALIASES)
		.sort((a, b) => b.length - a.length)
		.join("|");
	const partialWeekdayMatch = normalized.match(
		new RegExp(`^(${weekdayNamesPattern})(?:\\s+(.*))?$`),
	);
	if (partialWeekdayMatch) {
		const [, matchedWeekday, partialMod = ""] = partialWeekdayMatch;
		const modifiers = ["آینده", "گذشته", "بعد", "قبل"];
		for (const mod of modifiers) {
			if (!partialMod || mod.startsWith(partialMod)) {
				addSuggestion(`${matchedWeekday} ${mod}`);
			}
		}
	}

	return suggestions;
}
