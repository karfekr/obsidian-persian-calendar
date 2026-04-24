import { JALALI_EVENTS, HIJRI_EVENTS, GREGORIAN_EVENTS } from "src/constants";
import type {
	TEventObject,
	TDateFormat,
	TShowEvents,
	TEventRecord,
	TLocal,
	THijriBase,
} from "src/types";
import { dateToGregorian, dateToHijri, dateToJalali } from "src/utils/dateUtils";
import { dashToDate } from "src/utils/dashUtils";

function getEventsFromRecord(record: TEventRecord, month: number, day: number): TEventObject[] {
	return record[month]?.[day] ?? [];
}

// (Date) => Events[]
export function dateToEvents(
	date: Date,
	option?: { showEvents?: TShowEvents; hijriBase?: THijriBase },
): TEventObject[] {
	const showEvents = option?.showEvents ?? {
		showIROfficialEvents: false,
		showIRHistoricalEvents: false,
		showIRAncientEvents: false,
		showShiaEvents: false,
		showSunniEvents: false,
		showGlobalEvents: false,
	};
	const hijriBase = option?.hijriBase ?? "iran";

	const { jm, jd } = dateToJalali(date);
	const { gm, gd } = dateToGregorian(date);

	const jalaliEvents = getEventsFromRecord(JALALI_EVENTS, jm, jd).filter(
		(event) =>
			(event.categories.includes("official") && showEvents.showIROfficialEvents) ||
			(event.categories.includes("historical") && showEvents.showIRHistoricalEvents) ||
			(event.categories.includes("ancient") && showEvents.showIRAncientEvents),
	);

	const gregorianEvents = getEventsFromRecord(GREGORIAN_EVENTS, gm, gd).filter(
		(event) => event.categories.includes("global") && showEvents.showGlobalEvents,
	);

	const { hm: officialHM, hd: officialHD } = dateToHijri(date);
	const officialHijriEvents = getEventsFromRecord(HIJRI_EVENTS, officialHM, officialHD).filter(
		(event) =>
			(event.categories.includes("official") && showEvents.showIROfficialEvents) ||
			(event.categories.includes("historical") && showEvents.showIRHistoricalEvents),
	);

	const { hm, hd } = dateToHijri(date, { base: hijriBase });
	const religiousHijriEvents = getEventsFromRecord(HIJRI_EVENTS, hm, hd).filter(
		(event) =>
			(event.categories.includes("shia") && showEvents.showShiaEvents) ||
			(event.categories.includes("sunni") && showEvents.showSunniEvents),
	);

	const allEvents = [
		...jalaliEvents,
		...gregorianEvents,
		...officialHijriEvents,
		...religiousHijriEvents,
	];

	const uniqueEventsMap = new Map<string, TEventObject>();
	allEvents.forEach((event) => {
		const key = event.title.fa;
		if (!uniqueEventsMap.has(key)) {
			uniqueEventsMap.set(key, event);
		}
	});

	return Array.from(uniqueEventsMap.values());
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
	return events.some((event) => event.isHoliday === true);
}

// ("jy-jm-jd"|"jyjmjd"|"gy-gm-gd"|"gygmgd") => Events[]
export function dashToEvents(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: { showEvents?: TShowEvents; hijriBase?: THijriBase },
): TEventObject[] | null {
	const date = dashToDate(dashDate, dateFormat);
	if (!date) return null;

	return dateToEvents(date, { showEvents: option?.showEvents, hijriBase: option?.hijriBase });
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
