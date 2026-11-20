import { setAdapter } from "persian-holidays";
import type { TCustomEvent } from "src/types";
import {
	gregorianToCalendarDate,
	hijriToCalendarDate,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { checkHoliday, dateToEvents, eventsToString } from "src/utils/eventUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

const allEventsOff = {
	showIROfficialEvents: false,
	showIRHistoricalEvents: false,
	showIRAncientEvents: false,
	showShiaEvents: false,
	showSunniEvents: false,
	showGlobalEvents: false,
	showCustomEvents: false,
};

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

describe("dateToEvents", () => {
	it("returns an empty array when all event toggles are off", () => {
		const date = jalaliToCalendarDate(1404, 1, 1);

		expect(dateToEvents(date, { showEvents: allEventsOff })).toEqual([]);
	});

	it("returns events when at least one category is enabled", () => {
		const date = jalaliToCalendarDate(1404, 1, 1);

		const events = dateToEvents(date, {
			showEvents: { ...allEventsOff, showIROfficialEvents: true },
		});

		expect(events.length).toBeGreaterThan(0);
	});

	it("matches annual and one-time Jalali custom events even when built-in categories are off", () => {
		const customEvents: TCustomEvent[] = [
			{
				id: "1",
				title: "Annual Birthday",
				calendar: "jalali",
				month: 5,
				day: 12,
				isHoliday: false,
				enabled: true,
			},
			{
				id: "2",
				title: "Special 1404 Event",
				calendar: "jalali",
				year: 1404,
				month: 5,
				day: 12,
				isHoliday: true,
				enabled: true,
			},
		];

		const in1404 = dateToEvents(jalaliToCalendarDate(1404, 5, 12), {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			customEvents,
		});
		expect(in1404.map((e) => e.title.en)).toEqual(["Annual Birthday", "Special 1404 Event"]);
		expect(in1404[0].isCustom).toBe(true);
		expect(in1404[1].isHolidayInIran).toBe(true);

		const in1405 = dateToEvents(jalaliToCalendarDate(1405, 5, 12), {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			customEvents,
		});
		expect(in1405.map((e) => e.title.en)).toEqual(["Annual Birthday"]);
	});

	it("matches Gregorian and Hijri custom events", () => {
		const customEvents: TCustomEvent[] = [
			{
				id: "g1",
				title: "Gregorian Meetup",
				calendar: "gregorian",
				month: 6,
				day: 15,
				isHoliday: false,
				enabled: true,
			},
			{
				id: "h1",
				title: "Hijri Reminder",
				calendar: "hijri",
				month: 9,
				day: 1,
				isHoliday: false,
				enabled: true,
			},
		];

		const gregEvents = dateToEvents(gregorianToCalendarDate(2025, 6, 15), {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			customEvents,
		});
		expect(gregEvents.some((e) => e.title.en === "Gregorian Meetup")).toBe(true);

		const hijriEvents = dateToEvents(hijriToCalendarDate(1446, 9, 1, { base: "iran" }), {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			hijriBase: "iran",
			customEvents,
		});
		expect(hijriEvents.some((e) => e.title.en === "Hijri Reminder")).toBe(true);
	});

	it("excludes disabled custom events and respects showCustomEvents=false", () => {
		const customEvents: TCustomEvent[] = [
			{
				id: "disabled",
				title: "Disabled Event",
				calendar: "jalali",
				month: 5,
				day: 12,
				isHoliday: true,
				enabled: false,
			},
			{
				id: "enabled",
				title: "Enabled Event",
				calendar: "jalali",
				month: 5,
				day: 12,
				isHoliday: false,
				enabled: true,
			},
		];

		const date = jalaliToCalendarDate(1404, 5, 12);
		const enabledOnly = dateToEvents(date, {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			customEvents,
		});
		expect(enabledOnly.map((e) => e.title.en)).toEqual(["Enabled Event"]);

		const hiddenAll = dateToEvents(date, {
			showEvents: allEventsOff,
			customEvents,
		});
		expect(hiddenAll).toEqual([]);
	});

	it("respects custom event holiday flag in checkHoliday and eventsToString", () => {
		const date = jalaliToCalendarDate(1404, 5, 12);
		const holidayEvent: TCustomEvent = {
			id: "hol",
			title: "تولد",
			calendar: "jalali",
			month: 5,
			day: 12,
			isHoliday: true,
			enabled: true,
		};

		expect(checkHoliday(date, { customEvents: [holidayEvent], showCustomEvents: true })).toBe(true);
		expect(checkHoliday(date, { customEvents: [holidayEvent], showCustomEvents: false })).toBe(
			false,
		);

		const events = dateToEvents(date, {
			showEvents: { ...allEventsOff, showCustomEvents: true },
			customEvents: [holidayEvent],
		});
		expect(eventsToString(events, "fa")).toBe("- تولد (تعطیل)");
	});
});
