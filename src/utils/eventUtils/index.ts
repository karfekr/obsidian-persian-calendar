import type { CategoryType, EventType } from "persian-holidays";
import { getEvents } from "persian-holidays";
import type { TDateFormat, THijriBase, TLocal, TShowEvents } from "src/types";
import { dashToDate } from "src/utils/dashUtils";
import { dateToGregorian, dateToHijri, dateToJalali } from "src/utils/dateUtils";

import { setUmalquraEventAdapter } from "./eventAdapter";

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

function uniqueEvents(events: EventType[]): EventType[] {
	const seen = new Set<string>();

	return events.filter((e) => {
		const key = `${e.id}-${e.isHolidayInIran}`;

		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

// (Date) => Events[]
export function dateToEvents(
	date: Date,
	option?: { showEvents?: TShowEvents; hijriBase?: THijriBase },
): EventType[] {
	const showEvents = option?.showEvents ?? {
		showIROfficialEvents: false,
		showIRHistoricalEvents: false,
		showIRAncientEvents: false,
		showShiaEvents: false,
		showSunniEvents: false,
		showGlobalEvents: false,
	};
	const hijriBase = option?.hijriBase ?? "iran";

	const categories = buildCategories(showEvents);

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

	return uniqueEvents([...jalaliEvents, ...hijriEvents, ...gregorianEvents]);
}

// (Date) => (is holiday?)true|false
export function checkHoliday(date: Date): boolean {
	const showEvents: TShowEvents = {
		showIROfficialEvents: true,
		showIRHistoricalEvents: true,
		showIRAncientEvents: true,
		showShiaEvents: true,
		showSunniEvents: true,
		showGlobalEvents: true,
	};

	const events = dateToEvents(date, { showEvents });
	return events.some((event) => event.isHolidayInIran);
}

// ("jy-jm-jd"|"jyjmjd"|"gy-gm-gd"|"gygmgd") => Events[]
export function dashToEvents(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: { showEvents?: TShowEvents; hijriBase?: THijriBase },
): EventType[] | null {
	const date = dashToDate(dashDate, dateFormat);
	if (!date) return null;

	return dateToEvents(date, { showEvents: option?.showEvents, hijriBase: option?.hijriBase });
}

// (Events[]) => String(Events[])
export function eventsToString(events: EventType[] | null, local: TLocal = "fa"): string {
	if (!events || events.length === 0) {
		return "هیچ مناسبتی برای این روز ثبت نشده است.";
	}

	return events
		.map((event) => `- ${event.title[local]}${event.isHolidayInIran ? " (تعطیل)" : ""}`)
		.join("\n");
}
