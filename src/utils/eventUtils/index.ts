import type { CalendarDate } from "@internationalized/date";
import type { CategoryType, EventType } from "persian-holidays";
import { getEvents } from "persian-holidays";
import type { TCustomEvent, TDateFormat, THijriBase, TLocale, TShowEvents } from "src/types";
import { dashToCalendarDate } from "src/utils/dashUtils";
import { dateToGregorian, dateToHijri, dateToJalali } from "src/utils/dateUtils";

import { setUmalquraEventAdapter } from "./eventAdapter";

export type TCalendarEvent = EventType & {
	isCustom?: boolean;
};

type TEventQueryOption = {
	showEvents?: TShowEvents;
	hijriBase?: THijriBase;
	customEvents?: TCustomEvent[];
};

function buildCategories(showEvents: TShowEvents): CategoryType[] {
	const map: [boolean | undefined, CategoryType][] = [
		[showEvents.showGlobalEvents, "international"],
		[showEvents.showIROfficialEvents, "government"],
		[showEvents.showShiaEvents, "shia"],
		[showEvents.showSunniEvents, "sunni"],
		[showEvents.showIRAncientEvents, "ancient"],
		[showEvents.showIRHistoricalEvents, "historical"],
	];

	return map.filter(([flag]) => flag).map(([, cat]) => cat);
}

function uniqueEvents(events: TCalendarEvent[]): TCalendarEvent[] {
	const seen = new Set<string>();

	return events.filter((e) => {
		const key = `${e.id}-${e.isHolidayInIran}`;

		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function getMatchingCustomEvents(
	date: CalendarDate,
	customEvents: TCustomEvent[],
	hijriBase: THijriBase,
): TCalendarEvent[] {
	if (customEvents.length === 0) return [];

	const { jy, jm, jd } = dateToJalali(date);
	const { gy, gm, gd } = dateToGregorian(date);
	const { hy, hm, hd } = dateToHijri(date, { base: hijriBase });

	return customEvents
		.filter((event) => {
			if (!event.enabled) return false;

			const matchesDate = (year: number, month: number, day: number) =>
				event.month === month &&
				event.day === day &&
				(event.year === undefined || event.year === year);

			switch (event.calendar) {
				case "jalali":
					return matchesDate(jy, jm, jd);
				case "gregorian":
					return matchesDate(gy, gm, gd);
				case "hijri":
					return matchesDate(hy, hm, hd);
				default:
					return false;
			}
		})
		.map((event) => ({
			id: `custom-${event.id}`,
			title: { fa: event.title, en: event.title },
			categories: [],
			isHolidayInIran: event.isHoliday,
			calendar: event.calendar,
			type: "fixed",
			date: { month: event.month, day: event.day },
			isCustom: true,
		}));
}

// (CalendarDate) => Events[]
export function dateToEvents(date: CalendarDate, option?: TEventQueryOption): TCalendarEvent[] {
	const showEvents = option?.showEvents ?? {
		showIROfficialEvents: false,
		showIRHistoricalEvents: false,
		showIRAncientEvents: false,
		showShiaEvents: false,
		showSunniEvents: false,
		showGlobalEvents: false,
		showCustomEvents: true,
	};
	const hijriBase = option?.hijriBase ?? "iran";
	const customEvents = option?.customEvents ?? [];

	const categories = buildCategories(showEvents);
	const builtInEvents: TCalendarEvent[] = [];

	if (categories.length > 0) {
		const { jy, jm, jd } = dateToJalali(date);
		const jalaliEvents = getEvents("jalali", jm, jd, {
			year: jy,
			categories,
		});

		const { hy, hm, hd } = dateToHijri(date, { base: hijriBase });
		const hijriBaseEvents = getEvents("hijri", hm, hd, {
			year: hy,
			categories,
		});

		let hijriEvents: EventType[] = hijriBaseEvents;

		if (option?.hijriBase === "umalqura" && showEvents.showSunniEvents) {
			const { hy, hm, hd } = dateToHijri(date, { base: "umalqura" });

			const umalquraEvents = getEvents("hijri", hm, hd, {
				year: hy,
				categories,
				adapter: setUmalquraEventAdapter(),
				trueHolidays: false,
			});

			// merge + dedupe
			hijriEvents = uniqueEvents([...hijriBaseEvents, ...umalquraEvents]);
		}

		const { gy, gm, gd } = dateToGregorian(date);
		const gregorianEvents = getEvents("gregorian", gm, gd, {
			year: gy,
			categories,
		});

		builtInEvents.push(...jalaliEvents, ...hijriEvents, ...gregorianEvents);
	}

	const matchingCustomEvents =
		showEvents.showCustomEvents !== false
			? getMatchingCustomEvents(date, customEvents, hijriBase)
			: [];

	return uniqueEvents([...builtInEvents, ...matchingCustomEvents]);
}

// (CalendarDate) => (is holiday?)true|false
export function checkHoliday(
	date: CalendarDate,
	option?: { hijriBase?: THijriBase; customEvents?: TCustomEvent[]; showCustomEvents?: boolean },
): boolean {
	const showEvents: TShowEvents = {
		showIROfficialEvents: true,
		showIRHistoricalEvents: true,
		showIRAncientEvents: true,
		showShiaEvents: true,
		showSunniEvents: true,
		showGlobalEvents: true,
		showCustomEvents: option?.showCustomEvents ?? true,
	};

	const events = dateToEvents(date, {
		showEvents,
		hijriBase: option?.hijriBase,
		customEvents: option?.customEvents,
	});
	return events.some((event) => event.isHolidayInIran);
}

// ("jy-jm-jd"|"jyjmjd"|"gy-gm-gd"|"gygmgd") => Events[]
export function dashToEvents(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: TEventQueryOption,
): TCalendarEvent[] | null {
	const date = dashToCalendarDate(dashDate, dateFormat);
	if (!date) return null;

	return dateToEvents(date, {
		showEvents: option?.showEvents,
		hijriBase: option?.hijriBase,
		customEvents: option?.customEvents,
	});
}

// (Events[]) => String(Events[])
export function eventsToString(events: TCalendarEvent[] | null, local: TLocale = "fa"): string {
	if (!events || events.length === 0) {
		return "هیچ مناسبتی برای این روز ثبت نشده است.";
	}

	return events
		.map((event) => `- ${event.title[local]}${event.isHolidayInIran ? " (تعطیل)" : ""}`)
		.join("\n");
}
