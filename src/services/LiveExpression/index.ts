import type { Extension } from "@codemirror/state";
import type { MarkdownPostProcessorContext } from "obsidian";
import { MarkdownRenderChild, TFile } from "obsidian";
import {
	HIJRI_MONTHS_NAME,
	JALALI_MONTHS_NAME,
	PERSIAN_ZODIAC_FA,
	SEASONS_NAME,
	WEEKDAYS_NAME,
	WEEKDAYS_SHORT_FA,
	ZODIAC_SIGNS_FA,
} from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TDateFormat, TSuggestProvider } from "src/types";
import {
	checkKabiseh,
	dateToDaysPassedJYear,
	dateToDaysPassedSeason,
	dateToDaysRemainingSeason,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	getDaysInJalaliYear,
	getWeekdayTehran,
	getWeekStartCalculator,
	jalaliMonthLength,
	jalaliToSeason,
	nowTehran,
	todayTehran,
} from "src/utils/dateUtils";
import { dateToEvents } from "src/utils/eventUtils";

import { createLiveExpressionEditorExtension } from "./livePreviewExtension";

export type TLiveExpressionCadence = "second" | "minute" | "day";

export const LIVE_EXPRESSION_PATTERN = /\{#([^{}#]+)\}/g;

const SKIPPED_TAG_NAMES = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);

const SEASON_EMOJIS = ["🌸", "☀️", "🍂", "❄️"] as const;
const MONTH_EMOJIS = [
	"🌷",
	"🌺",
	"🌻",
	"🌞",
	"🍇",
	"🍂",
	"🍁",
	"🌧️",
	"❄️",
	"⛄",
	"🌨️",
	"🌸",
] as const;
const DAY_EMOJIS = ["📅", "📆", "📋", "📊", "📈", "🎉", "🕌"] as const;

const SECOND_CADENCE_KEYS = new Set<string>([
	"ساعت",
	"ساعت_en",
	"ساعت_۱۲",
	"ثانیه",
	"ثانیه_۲رقم",
	"زمان_کامل",
	"timestamp_unix",
]);

const MINUTE_CADENCE_KEYS = new Set<string>([
	"ساعت_عدد",
	"ساعت_۲رقم",
	"دقیقه",
	"دقیقه_۲رقم",
	"زمان_کوتاه",
	"تاریخ_ساعت",
	"تا_پایان_ماه_ساعت",
	"تا_آخر_ماه_ساعت",
	"تا_پایان_روز_ساعت",
	"تا_پایان_روز_دقیقه",
	"از_آغاز_روز_ساعت",
	"از_آغاز_روز_دقیقه",
	"درصد_روز",
	"درصد_روز_عدد",
	"پیشرفت_روز",
	"روز_شب_emoji",
	"امضا_تاریخ",
	"تایمر_روز",
]);

export const LIVE_EXPRESSION_KEYS = [
	// Time & Clock (second / minute cadence, no sub-second counters)
	"ساعت",
	"ساعت_en",
	"ساعت_۱۲",
	"ساعت_عدد",
	"ساعت_۲رقم",
	"دقیقه",
	"دقیقه_۲رقم",
	"ثانیه",
	"ثانیه_۲رقم",
	"timestamp_unix",
	"زمان_کوتاه",
	"زمان_کامل",
	"تایمر_روز",
	// Jalali Dates
	"تاریخ",
	"تاریخ_کامل",
	"تاریخ_خط_تیره",
	"تاریخ_اسلش",
	"تاریخ_نقطه",
	"تاریخ_حروفی",
	"تاریخ_کوتاه",
	"تاریخ_ساعت",
	// Year
	"سال",
	"سال_شمسی",
	"سال_میلادی",
	"سال_قمری",
	"سال_کبیسه",
	"سال_کبیسه_میلادی",
	"روز_سال",
	"روز_باقی_سال",
	"کل_روز_سال",
	"نیم_سال",
	"سه_ماهه",
	"فصل_مالی",
	"قرن_شمسی",
	"دهه_شمسی",
	"قرن_میلادی",
	// Month
	"ماه",
	"نام_ماه",
	"نام_ماه_en",
	"شماره_ماه",
	"شماره_ماه_۲رقم",
	"ماه_قمری",
	"نام_ماه_قمری",
	"شماره_ماه_قمری",
	"ماه_میلادی",
	"نام_ماه_میلادی",
	"شماره_ماه_میلادی",
	"روز_ماه",
	"تعداد_روز_ماه",
	"روز_باقی_ماه",
	"دهه_ماه",
	// Day
	"روز",
	"نام_روز",
	"نام_روز_کوتاه",
	"نام_روز_en",
	"شماره_روز",
	"شماره_روز_۲رقم",
	"شماره_روز_هفته",
	"شماره_روز_میلادی",
	"شماره_روز_قمری",
	"شماره_روز_سال",
	// Week, Season & Zodiac
	"هفته",
	"هفته_سال",
	"هفته_ماه",
	"آخر_هفته",
	"روز_کاری",
	"روز_باقی_هفته",
	"فصل",
	"شماره_فصل",
	"روز_فصل",
	"روز_باقی_فصل",
	"برج",
	"برج_فارسی",
	// Countdowns & Elapsed
	"تا_نوروز",
	"تا_نوروز_روز",
	"تا_نوروز_هفته",
	"تا_پایان_سال_روز",
	"تا_آخر_سال_روز",
	"تا_پایان_سال_هفته",
	"تا_آخر_سال_هفته",
	"تا_پایان_سال_ماه",
	"تا_آخر_سال_ماه",
	"تا_پایان_ماه_روز",
	"تا_آخر_ماه_روز",
	"تا_پایان_ماه_ساعت",
	"تا_آخر_ماه_ساعت",
	"تا_پایان_هفته_روز",
	"تا_آخر_هفته_روز",
	"تا_پایان_روز_ساعت",
	"تا_پایان_روز_دقیقه",
	"از_آغاز_سال_روز",
	"از_اول_سال_روز",
	"از_آغاز_سال_هفته",
	"از_اول_سال_هفته",
	"از_آغاز_ماه_روز",
	"از_اول_ماه_روز",
	"از_آغاز_فصل_روز",
	"از_اول_فصل_روز",
	"از_آغاز_روز_ساعت",
	"از_آغاز_روز_دقیقه",
	// Percentages & Progress Bars
	"درصد_سال",
	"درصد_سال_عدد",
	"درصد_ماه",
	"درصد_ماه_عدد",
	"درصد_هفته",
	"درصد_هفته_عدد",
	"درصد_فصل",
	"درصد_روز",
	"درصد_روز_عدد",
	"پیشرفت_سال",
	"پیشرفت_ماه",
	"پیشرفت_هفته",
	"پیشرفت_فصل",
	"پیشرفت_روز",
	// Events & Holidays
	"مناسبت",
	"مناسبت_امروز",
	"مناسبت_اول",
	"تعطیل",
	"تعطیل_امروز",
	"تعداد_مناسبت",
	"نوع_روز",
	// Gregorian & Hijri Dates
	"تاریخ_میلادی",
	"تاریخ_میلادی_کامل",
	"تاریخ_میلادی_حروفی",
	"تاریخ_قمری",
	"تاریخ_قمری_کامل",
	"تاریخ_قمری_حروفی",
	// Emojis & Combined
	"فصل_emoji",
	"روز_شب_emoji",
	"ماه_emoji",
	"روز_هفته_emoji",
	"تعطیل_emoji",
	"امضا_تاریخ",
	"وضعیت_کامل",
] as const;

export function createProgressBar(ratio: number): string {
	const clamped = Math.max(0, Math.min(1, ratio));
	const filled = Math.round(clamped * 10);
	const empty = 10 - filled;
	return `${"█".repeat(filled)}${"░".repeat(empty)} ${(clamped * 100).toFixed(0)}%`;
}

type RenderedExpressionEntry = {
	el: HTMLElement;
	key: string;
	cadence: TLiveExpressionCadence;
};

class LiveExpressionRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private readonly entries: RenderedExpressionEntry[],
		private readonly liveExpression: LiveExpression,
		private readonly filePath: string,
	) {
		super(containerEl);
	}

	onload(): void {
		for (const entry of this.entries) {
			const unsubscribe = this.liveExpression.subscribe(entry.cadence, () => {
				const file = this.liveExpression.resolveFile(this.filePath);
				const nextValue = this.liveExpression.calculateValue(entry.key, file);
				if (nextValue !== null && entry.el.textContent !== String(nextValue)) {
					entry.el.textContent = String(nextValue);
				}
			});
			this.register(unsubscribe);
		}
	}
}

function shouldSkipElement(el: Element | null): boolean {
	let current: Element | null = el;
	while (current) {
		if (SKIPPED_TAG_NAMES.has(current.tagName)) return true;
		if (current.classList?.contains("persian-live-expression")) return true;
		current = current.parentElement;
	}
	return false;
}

export default class LiveExpression {
	plugin: PersianCalendarPlugin;

	private readonly listeners: Record<TLiveExpressionCadence, Set<() => void>> = {
		second: new Set(),
		minute: new Set(),
		day: new Set(),
	};

	private secondInterval: ReturnType<typeof globalThis.setInterval> | null = null;
	private minuteAlignTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
	private minuteInterval: ReturnType<typeof globalThis.setInterval> | null = null;
	private dayTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public getCadence(keyword: string): TLiveExpressionCadence {
		const trimmed = keyword.trim();
		if (SECOND_CADENCE_KEYS.has(trimmed)) return "second";
		if (MINUTE_CADENCE_KEYS.has(trimmed)) return "minute";
		return "day";
	}

	public getActiveListenerCount(cadence?: TLiveExpressionCadence): number {
		if (cadence) return this.listeners[cadence].size;
		return this.listeners.second.size + this.listeners.minute.size + this.listeners.day.size;
	}

	public subscribe(cadence: TLiveExpressionCadence, listener: () => void): () => void {
		const bucket = this.listeners[cadence];
		bucket.add(listener);

		if (bucket.size === 1) {
			this.startCadenceTimer(cadence);
		}

		return () => {
			bucket.delete(listener);
			if (bucket.size === 0) {
				this.stopCadenceTimer(cadence);
			}
		};
	}

	private notifyCadence(cadence: TLiveExpressionCadence): void {
		for (const listener of this.listeners[cadence]) {
			listener();
		}
	}

	private startCadenceTimer(cadence: TLiveExpressionCadence): void {
		if (cadence === "second") {
			if (this.secondInterval !== null) return;
			this.secondInterval = globalThis.setInterval(() => {
				this.notifyCadence("second");
			}, 1000);
			return;
		}

		if (cadence === "minute") {
			if (this.minuteAlignTimeout !== null || this.minuteInterval !== null) return;
			const zdt = nowTehran();
			const msUntilNextMinute = Math.max(50, (60 - zdt.second) * 1000 - zdt.millisecond);
			this.minuteAlignTimeout = globalThis.setTimeout(() => {
				this.minuteAlignTimeout = null;
				this.notifyCadence("minute");
				if (this.listeners.minute.size > 0) {
					this.minuteInterval = globalThis.setInterval(() => {
						this.notifyCadence("minute");
					}, 60_000);
				}
			}, msUntilNextMinute);
			return;
		}

		this.scheduleNextDayTick();
	}

	private scheduleNextDayTick(): void {
		if (this.dayTimeout !== null || this.listeners.day.size === 0) return;

		const zdt = nowTehran();
		const secondsUntilMidnight = (24 - zdt.hour) * 3600 - zdt.minute * 60 - zdt.second;
		const msUntilMidnight = Math.max(1000, secondsUntilMidnight * 1000 - zdt.millisecond + 100);

		this.dayTimeout = globalThis.setTimeout(() => {
			this.dayTimeout = null;
			this.notifyCadence("day");
			this.scheduleNextDayTick();
		}, msUntilMidnight);
	}

	private stopCadenceTimer(cadence: TLiveExpressionCadence): void {
		if (cadence === "second") {
			if (this.secondInterval !== null) {
				globalThis.clearInterval(this.secondInterval);
				this.secondInterval = null;
			}
			return;
		}

		if (cadence === "minute") {
			if (this.minuteAlignTimeout !== null) {
				globalThis.clearTimeout(this.minuteAlignTimeout);
				this.minuteAlignTimeout = null;
			}
			if (this.minuteInterval !== null) {
				globalThis.clearInterval(this.minuteInterval);
				this.minuteInterval = null;
			}
			return;
		}

		if (this.dayTimeout !== null) {
			globalThis.clearTimeout(this.dayTimeout);
			this.dayTimeout = null;
		}
	}

	public destroy(): void {
		this.stopCadenceTimer("second");
		this.stopCadenceTimer("minute");
		this.stopCadenceTimer("day");
		this.listeners.second.clear();
		this.listeners.minute.clear();
		this.listeners.day.clear();
	}

	public resolveFile(filePath?: string | null): TFile | null {
		if (!filePath) return null;
		const abstractFile = this.plugin.app.vault.getAbstractFileByPath(filePath);
		return abstractFile instanceof TFile ? abstractFile : null;
	}

	public getAllExpressionKeys(file?: TFile | null): string[] {
		const placeholderKeys = this.plugin.placeholder
			? this.plugin.placeholder
					.getAllPlaceholderKeys(file ?? undefined)
					.map((k) => k.replace(/^\{\{|\}\}$/g, ""))
			: [];

		return Array.from(new Set([...LIVE_EXPRESSION_KEYS, ...placeholderKeys]));
	}

	public calculateValue(keyword: string, file?: TFile | null): string | number | null {
		const trimmed = keyword.trim();
		if (!trimmed) return null;

		const zdt = nowTehran();
		const nowDate = zdt.toDate();
		const currentDate = todayTehran();

		const j = dateToJalali(currentDate);
		const g = dateToGregorian(currentDate);
		const h = dateToHijri(currentDate, { base: this.plugin.setting.hijriBase });

		const isLeap = checkKabiseh(j.jy);
		const daysInYear = getDaysInJalaliYear(j.jy);
		const daysInMonth = jalaliMonthLength(j.jy, j.jm);
		const dayOfYear = dateToDaysPassedJYear(currentDate);

		// 0 = Saturday .. 6 = Friday
		const dayOfWeek = (getWeekdayTehran(currentDate) + 1) % 7;
		const weekdayIndex = dayOfWeek + 1; // 1 = Saturday .. 7 = Friday
		const weekOfYear = getWeekStartCalculator(this.plugin.setting.weekCalculation).getWeekNumber(
			currentDate,
		).weekNumber;

		const season = jalaliToSeason(j.jm); // 1..4
		const dayOfSeason = dateToDaysPassedSeason(currentDate);
		const daysRemainingSeason = dateToDaysRemainingSeason(currentDate);
		const seasonTotal = dayOfSeason + daysRemainingSeason;

		const daysToNowruz = j.jm === 1 && j.jd === 1 ? 0 : daysInYear - dayOfYear + 1;

		const getEventsLazy = () =>
			dateToEvents(currentDate, {
				showEvents: this.plugin.setting,
				hijriBase: this.plugin.setting.hijriBase,
				customEvents: this.plugin.getAllCustomEvents?.() ?? this.plugin.setting.customEvents,
			});

		const locale = this.plugin.setting.language ?? "fa";
		const hh = String(zdt.hour).padStart(2, "0");
		const mm = String(zdt.minute).padStart(2, "0");
		const ss = String(zdt.second).padStart(2, "0");
		const jmm = String(j.jm).padStart(2, "0");
		const jdd = String(j.jd).padStart(2, "0");

		switch (trimmed) {
			case "ساعت":
				return nowDate.toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });
			case "ساعت_en":
				return nowDate.toLocaleTimeString("en-US", {
					timeZone: "Asia/Tehran",
					hour12: false,
				});
			case "ساعت_۱۲":
				return nowDate.toLocaleTimeString("fa-IR", {
					timeZone: "Asia/Tehran",
					hour12: true,
				});
			case "ساعت_عدد":
				return zdt.hour;
			case "ساعت_۲رقم":
				return hh;
			case "دقیقه":
				return zdt.minute;
			case "دقیقه_۲رقم":
				return mm;
			case "ثانیه":
				return zdt.second;
			case "ثانیه_۲رقم":
				return ss;
			case "timestamp_unix":
				return Math.floor(nowDate.getTime() / 1000);
			case "زمان_کوتاه":
				return `${hh}:${mm}`;
			case "زمان_کامل":
				return `${hh}:${mm}:${ss}`;
			case "تاریخ_کامل":
				return `${WEEKDAYS_NAME.fa[weekdayIndex]} ${j.jd} ${JALALI_MONTHS_NAME.fa[j.jm]} ${j.jy}`;
			case "تاریخ_خط_تیره":
				return `${j.jy}-${jmm}-${jdd}`;
			case "تاریخ_اسلش":
			case "تاریخ":
				return `${j.jy}/${jmm}/${jdd}`;
			case "تاریخ_نقطه":
				return `${j.jy}.${jmm}.${jdd}`;
			case "تاریخ_حروفی":
				return `${j.jd} ${JALALI_MONTHS_NAME.fa[j.jm]} ${j.jy}`;
			case "تاریخ_کوتاه":
				return `${j.jd}/${j.jm}`;
			case "تاریخ_ساعت":
				return `${j.jy}/${jmm}/${jdd} - ${hh}:${mm}`;
			case "سال":
			case "سال_شمسی":
				return j.jy;
			case "سال_میلادی":
				return g.gy;
			case "سال_قمری":
				return h.hy;
			case "سال_کبیسه":
				return isLeap ? "بله" : "خیر";
			case "سال_کبیسه_میلادی":
				return (g.gy % 4 === 0 && g.gy % 100 !== 0) || g.gy % 400 === 0 ? "بله" : "خیر";
			case "روز_سال":
				return dayOfYear;
			case "روز_باقی_سال":
				return daysInYear - dayOfYear;
			case "کل_روز_سال":
				return daysInYear;
			case "ماه":
			case "نام_ماه":
				return JALALI_MONTHS_NAME.fa[j.jm];
			case "نام_ماه_en":
				return JALALI_MONTHS_NAME.en[j.jm];
			case "شماره_ماه":
				return j.jm;
			case "شماره_ماه_۲رقم":
				return jmm;
			case "ماه_قمری":
			case "نام_ماه_قمری":
				return HIJRI_MONTHS_NAME.fa[h.hm].trim();
			case "شماره_ماه_قمری":
				return h.hm;
			case "ماه_میلادی":
			case "نام_ماه_میلادی":
				return nowDate.toLocaleDateString("en-US", {
					timeZone: "Asia/Tehran",
					month: "long",
				});
			case "شماره_ماه_میلادی":
				return g.gm;
			case "روز_ماه":
			case "تعداد_روز_ماه":
				return daysInMonth;
			case "روز_باقی_ماه":
				return daysInMonth - j.jd;
			case "روز":
			case "نام_روز":
				return WEEKDAYS_NAME.fa[weekdayIndex];
			case "نام_روز_کوتاه":
				return WEEKDAYS_SHORT_FA[weekdayIndex];
			case "نام_روز_en":
				return WEEKDAYS_NAME.en[weekdayIndex];
			case "شماره_روز":
				return j.jd;
			case "شماره_روز_۲رقم":
				return jdd;
			case "شماره_روز_هفته":
				return weekdayIndex;
			case "شماره_روز_میلادی":
				return g.gd;
			case "شماره_روز_قمری":
				return h.hd;
			case "شماره_روز_سال":
				return dayOfYear;
			case "هفته":
			case "هفته_سال":
				return weekOfYear;
			case "هفته_ماه":
				return Math.ceil(j.jd / 7);
			case "آخر_هفته":
				return dayOfWeek === 5 || dayOfWeek === 6 ? "بله" : "خیر";
			case "روز_کاری":
				return dayOfWeek >= 0 && dayOfWeek <= 4 ? "بله" : "خیر";
			case "روز_باقی_هفته":
				return 6 - dayOfWeek;
			case "فصل":
				return SEASONS_NAME.fa[season];
			case "شماره_فصل":
				return season;
			case "روز_فصل":
				return dayOfSeason;
			case "روز_باقی_فصل":
				return daysRemainingSeason;
			case "برج":
				return ZODIAC_SIGNS_FA[j.jm];
			case "برج_فارسی":
				return PERSIAN_ZODIAC_FA[j.jm];
			case "تا_پایان_سال_روز":
			case "تا_آخر_سال_روز":
				return daysInYear - dayOfYear;
			case "تا_پایان_سال_هفته":
			case "تا_آخر_سال_هفته":
				return Math.floor((daysInYear - dayOfYear) / 7);
			case "تا_پایان_سال_ماه":
			case "تا_آخر_سال_ماه":
				return 12 - j.jm;
			case "تا_پایان_ماه_روز":
			case "تا_آخر_ماه_روز":
				return daysInMonth - j.jd;
			case "تا_پایان_ماه_ساعت":
			case "تا_آخر_ماه_ساعت":
				return (daysInMonth - j.jd) * 24 + (24 - zdt.hour);
			case "تا_پایان_هفته_روز":
			case "تا_آخر_هفته_روز":
				return 6 - dayOfWeek;
			case "تا_پایان_روز_ساعت":
				return 24 - zdt.hour;
			case "تا_پایان_روز_دقیقه":
				return (24 - zdt.hour) * 60 - zdt.minute;
			case "تا_نوروز":
			case "تا_نوروز_روز":
				return daysToNowruz;
			case "تا_نوروز_هفته":
				return Math.floor(daysToNowruz / 7);
			case "از_آغاز_سال_روز":
			case "از_اول_سال_روز":
				return dayOfYear;
			case "از_آغاز_سال_هفته":
			case "از_اول_سال_هفته":
				return Math.floor(dayOfYear / 7);
			case "از_آغاز_ماه_روز":
			case "از_اول_ماه_روز":
				return j.jd;
			case "از_آغاز_فصل_روز":
			case "از_اول_فصل_روز":
				return dayOfSeason;
			case "از_آغاز_روز_ساعت":
				return zdt.hour;
			case "از_آغاز_روز_دقیقه":
				return zdt.hour * 60 + zdt.minute;
			case "درصد_سال":
				return `${((dayOfYear / daysInYear) * 100).toFixed(1)}%`;
			case "درصد_سال_عدد":
				return ((dayOfYear / daysInYear) * 100).toFixed(1);
			case "درصد_ماه":
				return `${((j.jd / daysInMonth) * 100).toFixed(1)}%`;
			case "درصد_ماه_عدد":
				return ((j.jd / daysInMonth) * 100).toFixed(1);
			case "درصد_هفته":
				return `${((weekdayIndex / 7) * 100).toFixed(1)}%`;
			case "درصد_هفته_عدد":
				return ((weekdayIndex / 7) * 100).toFixed(1);
			case "درصد_فصل":
				return `${((dayOfSeason / seasonTotal) * 100).toFixed(1)}%`;
			case "درصد_روز": {
				const minutesPassed = zdt.hour * 60 + zdt.minute;
				return `${((minutesPassed / 1440) * 100).toFixed(1)}%`;
			}
			case "درصد_روز_عدد": {
				const minPassed = zdt.hour * 60 + zdt.minute;
				return ((minPassed / 1440) * 100).toFixed(1);
			}
			case "پیشرفت_سال":
				return createProgressBar(dayOfYear / daysInYear);
			case "پیشرفت_ماه":
				return createProgressBar(j.jd / daysInMonth);
			case "پیشرفت_هفته":
				return createProgressBar(weekdayIndex / 7);
			case "پیشرفت_فصل":
				return createProgressBar(dayOfSeason / seasonTotal);
			case "پیشرفت_روز": {
				const dayMinutes = zdt.hour * 60 + zdt.minute;
				return createProgressBar(dayMinutes / 1440);
			}
			case "مناسبت":
			case "مناسبت_امروز": {
				const events = getEventsLazy();
				const str = events.map((e) => e.title[locale]).join(" | ");
				return str || "بدون مناسبت";
			}
			case "مناسبت_اول": {
				const events = getEventsLazy();
				return events.length > 0 ? events[0].title[locale] : "بدون مناسبت";
			}
			case "تعطیل":
			case "تعطیل_امروز": {
				const events = getEventsLazy();
				const hasHoliday = events.some((e) => e.isHolidayInIran);
				return hasHoliday || dayOfWeek === 6 ? "بله" : "خیر";
			}
			case "تعداد_مناسبت":
				return getEventsLazy().length;
			case "نوع_روز": {
				if (dayOfWeek === 6) return "جمعه";
				if (dayOfWeek === 5) return "پنجشنبه";
				const hasHoliday = getEventsLazy().some((e) => e.isHolidayInIran);
				if (hasHoliday) return "تعطیل رسمی";
				return "روز کاری";
			}
			case "تاریخ_میلادی":
				return `${g.gy}/${String(g.gm).padStart(2, "0")}/${String(g.gd).padStart(2, "0")}`;
			case "تاریخ_میلادی_کامل":
				return nowDate.toLocaleDateString("en-US", {
					timeZone: "Asia/Tehran",
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			case "تاریخ_میلادی_حروفی": {
				const gMonthName = nowDate.toLocaleDateString("en-US", {
					timeZone: "Asia/Tehran",
					month: "long",
				});
				return `${g.gd} ${gMonthName} ${g.gy}`;
			}
			case "تاریخ_قمری":
				return `${h.hy}/${String(h.hm).padStart(2, "0")}/${String(h.hd).padStart(2, "0")}`;
			case "تاریخ_قمری_کامل":
				return `${h.hd} ${HIJRI_MONTHS_NAME.fa[h.hm].trim()} ${h.hy}`;
			case "تاریخ_قمری_حروفی":
				return `${h.hd} ${HIJRI_MONTHS_NAME.fa[h.hm].trim()} ${h.hy} هجری قمری`;
			case "نیم_سال":
				return j.jm <= 6 ? "اول" : "دوم";
			case "سه_ماهه":
			case "فصل_مالی":
				return `Q${season}`;
			case "دهه_ماه":
				return j.jd <= 10 ? "اول" : j.jd <= 20 ? "دوم" : "سوم";
			case "قرن_شمسی":
				return Math.ceil(j.jy / 100);
			case "دهه_شمسی":
				return `${Math.floor(j.jy / 10) * 10}ها`;
			case "قرن_میلادی":
				return Math.ceil(g.gy / 100);
			case "فصل_emoji":
				return SEASON_EMOJIS[season - 1];
			case "روز_شب_emoji": {
				if (zdt.hour >= 5 && zdt.hour < 12) return "🌅";
				if (zdt.hour >= 12 && zdt.hour < 17) return "☀️";
				if (zdt.hour >= 17 && zdt.hour < 20) return "🌆";
				return "🌙";
			}
			case "ماه_emoji":
				return MONTH_EMOJIS[j.jm - 1];
			case "روز_هفته_emoji":
				return DAY_EMOJIS[dayOfWeek];
			case "تعطیل_emoji": {
				const hasHoliday = getEventsLazy().some((e) => e.isHolidayInIran);
				return hasHoliday || dayOfWeek === 6 ? "🔴" : "🟢";
			}
			case "امضا_تاریخ":
				return `📅 ${j.jd} ${JALALI_MONTHS_NAME.fa[j.jm]} ${j.jy} | ⏰ ${hh}:${mm}`;
			case "وضعیت_کامل": {
				const wName = WEEKDAYS_NAME.fa[weekdayIndex];
				const mName = JALALI_MONTHS_NAME.fa[j.jm];
				return `${wName} ${j.jd} ${mName} | هفته ${weekOfYear} | ${SEASONS_NAME.fa[season]}`;
			}
			case "تایمر_روز": {
				const remaining = (24 - zdt.hour) * 60 - zdt.minute;
				const rHours = Math.floor(remaining / 60);
				const rMins = remaining % 60;
				return `${rHours}:${String(rMins).padStart(2, "0")} تا پایان روز`;
			}
			default: {
				if (this.plugin.placeholder) {
					const activeFile = file ?? this.plugin.app.workspace.getActiveFile();
					const context =
						activeFile instanceof TFile
							? this.plugin.placeholder.buildContext(activeFile)
							: {
									currentDate,
									fileDate: null,
									fileName: "",
									baseDate: this.plugin.setting.dateFormat as TDateFormat,
								};
					const placeholderVal = this.plugin.placeholder
						.getPlaceholderMap(context)
						.get(`{{${trimmed}}}`);
					if (placeholderVal !== undefined && placeholderVal !== null) {
						return typeof placeholderVal === "boolean" ? String(placeholderVal) : placeholderVal;
					}
				}
				return null;
			}
		}
	}

	public handlePostProcess(element: HTMLElement, context: MarkdownPostProcessorContext): void {
		const ownerDoc = element.ownerDocument;
		if (!ownerDoc) return;

		const file = this.resolveFile(context.sourcePath);
		const textNodes: Text[] = [];
		const walker = ownerDoc.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);

		let currentNode = walker.nextNode();
		while (currentNode) {
			const textNode = currentNode as Text;
			if (textNode.nodeValue?.includes("{#") && !shouldSkipElement(textNode.parentElement)) {
				textNodes.push(textNode);
			}
			currentNode = walker.nextNode();
		}

		if (textNodes.length === 0) return;

		const renderedEntries: RenderedExpressionEntry[] = [];

		for (const textNode of textNodes) {
			const rawText = textNode.nodeValue ?? "";
			const regex = new RegExp(LIVE_EXPRESSION_PATTERN.source, "g");
			let lastIndex = 0;
			let hasReplacement = false;
			const fragment = ownerDoc.createDocumentFragment();

			for (const match of rawText.matchAll(regex)) {
				const matchIndex = match.index ?? 0;
				const key = match[1];
				const value = this.calculateValue(key, file);
				if (value === null) continue;

				if (matchIndex > lastIndex) {
					fragment.appendChild(ownerDoc.createTextNode(rawText.slice(lastIndex, matchIndex)));
				}

				const span = ownerDoc.createElement("span");
				span.className = "persian-live-expression";
				span.dataset.key = key;
				span.textContent = String(value);
				fragment.appendChild(span);

				renderedEntries.push({
					el: span,
					key,
					cadence: this.getCadence(key),
				});

				lastIndex = matchIndex + match[0].length;
				hasReplacement = true;
			}

			if (hasReplacement) {
				if (lastIndex < rawText.length) {
					fragment.appendChild(ownerDoc.createTextNode(rawText.slice(lastIndex)));
				}
				textNode.parentNode?.replaceChild(fragment, textNode);
			}
		}

		if (renderedEntries.length > 0) {
			context.addChild(
				new LiveExpressionRenderChild(element, renderedEntries, this, context.sourcePath),
			);
		}
	}

	public createEditorExtension(): Extension {
		return createLiveExpressionEditorExtension(this);
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /(?<!\{)\{#[^}]*$/,
			getSuggestions: (query: string) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				return this.getAllExpressionKeys(activeFile)
					.filter((key) => key.includes(query))
					.map((key) => `{#${key}}`);
			},
			onSelect: (value: string) => value,
		};
	}
}
