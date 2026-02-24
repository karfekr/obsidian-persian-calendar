import { JALALI_EVENTS, HIJRI_EVENTS, GREGORIAN_EVENTS } from "src/constants";
import type { TEventObject, TDateFormat, TShowEvents, TEventRecord, TLocal } from "src/types";
import { dateToGregorian, dateToHijri, dateToJalali } from "src/utils/dateUtils";
import { dashToDate } from "src/utils/dashUtils";

function getEventsFromRecord(record: TEventRecord, month: number, day: number): TEventObject[] {
	return record[month]?.[day] ?? [];
}

// (Date) => Events[]
export function dateToEvents(date: Date, option: TShowEvents = {}): TEventObject[] {
	const {
		showIROfficialEvents = false,
		showIRHistoricalEvents = false,
		showIRAncientEvents = false,
		showShiaEvents = false,
		showSunniEvents = false,
		showGlobalEvents = false,
	} = option;

	const { jm, jd } = dateToJalali(date);
	const { gm, gd } = dateToGregorian(date);
	const { hm, hd } = dateToHijri(date);

	const jalaliEvents = getEventsFromRecord(JALALI_EVENTS, jm, jd).filter((event) => {
		if (event.categories.includes("official")) return showIROfficialEvents;
		if (event.categories.includes("historical")) return showIRHistoricalEvents;
		if (event.categories.includes("ancient")) return showIRAncientEvents;
		return false;
	});

	const gregorianEvents = getEventsFromRecord(GREGORIAN_EVENTS, gm, gd).filter(
		(event) => event.categories.includes("global") && showGlobalEvents,
	);

	const hijriEvents = getEventsFromRecord(HIJRI_EVENTS, hm, hd).filter(
		(event) =>
			(event.categories.includes("official") && showIROfficialEvents) ||
			(event.categories.includes("historical") && showIRHistoricalEvents) ||
			(event.categories.includes("shia") && showShiaEvents) ||
			(event.categories.includes("sunni") && showSunniEvents),
	);

	return [...jalaliEvents, ...gregorianEvents, ...hijriEvents];
}

// (Date) => (is holiday?)true|false
export function checkHoliday(date: Date): boolean {
	const option: TShowEvents = {
		showIROfficialEvents: true,
		showIRHistoricalEvents: true,
		showIRAncientEvents: true,
		showShiaEvents: true,
		showSunniEvents: true,
		showGlobalEvents: true,
	};

	const events = dateToEvents(date, option);
	return events.some((event) => event.isHoliday === true);
}

// ("jy-jm-jd"|"jyjmjd"|"gy-gm-gd"|"gygmgd") => Events[]
export function dashToEvents(
	dashDate: string,
	dateFormat: TDateFormat,
	option: TShowEvents,
): TEventObject[] | null {
	const date = dashToDate(dashDate, dateFormat);
	if (!date) return null;

	return dateToEvents(date, option);
}

// (Events[]) => String(Events[])
export function eventsToString(events: TEventObject[] | null, local: TLocal = "fa"): string {
	if (!events || events.length === 0) {
		return "هیچ مناسبتی برای این روز ثبت نشده است.";
	}

	return events
		.map((event) => "- " + event.title[local] + (event.isHoliday ? " (تعطیل)" : ""))
		.join("\n");
}
