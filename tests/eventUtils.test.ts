import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import ApiService from "src/services/ApiService";
import Placeholder from "src/services/Placeholder";
import GridService from "src/templates/CalendarView/CalendarRenderer/CalendarBody/GridService";
import Tooltip from "src/templates/CalendarView/CalendarRenderer/CalendarBody/Tooltip";
import CalendarState from "src/templates/CalendarView/CalendarState";
import type { TVaultEventSource } from "src/types";
import {
	calendarDateToDate,
	gregorianToCalendarDate,
	hijriToCalendarDate,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { checkHoliday, dateToEvents, eventsToString } from "src/utils/eventUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";
import { parseVaultEventsNote } from "src/utils/vaultEventUtils";

const allEventsOff = {
	showIROfficialEvents: false,
	showIRHistoricalEvents: false,
	showIRAncientEvents: false,
	showShiaEvents: false,
	showSunniEvents: false,
	showGlobalEvents: false,
	showCustomEvents: false,
};

const source: TVaultEventSource = {
	id: "family",
	path: "Family.md",
	calendar: "jalali",
	enabled: true,
};

const customEvents = parseVaultEventsNote(
	"1404-05-12 | تولد | green | تعطیل\n05-13 | دورهمی | orange",
	source,
);
const holiday = jalaliToCalendarDate(1404, 5, 12);
const regularDay = jalaliToCalendarDate(1404, 5, 13);

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

describe("dateToEvents", () => {
	it("returns an empty array when all event toggles are off", () => {
		expect(dateToEvents(holiday, { showEvents: allEventsOff, customEvents })).toEqual([]);
	});

	it("returns events when at least one built-in category is enabled", () => {
		const date = jalaliToCalendarDate(1404, 1, 1);
		const events = dateToEvents(date, {
			showEvents: { ...allEventsOff, showIROfficialEvents: true },
		});
		expect(events.length).toBeGreaterThan(0);
	});

	it.each([
		{ calendar: "jalali", eventYear: 1405, toDate: jalaliToCalendarDate },
		{ calendar: "gregorian", eventYear: 2025, toDate: gregorianToCalendarDate },
		{ calendar: "hijri", eventYear: 1446, toDate: hijriToCalendarDate },
	] as const)(
		"matches one-time and recurring dates in the $calendar calendar",
		({ calendar, eventYear, toDate }) => {
			const customEvents = parseVaultEventsNote(
				`${eventYear}-12-02 | تولد | cyan | تعطیل\n12-03 | دورهمی | green | تعطیل`,
				{ ...source, calendar },
			);
			for (const year of [eventYear - 1, eventYear, eventYear + 1]) {
				const oneTime = dateToEvents(toDate(year, 12, 2), { customEvents });
				const recurring = dateToEvents(toDate(year, 12, 3), { customEvents });
				expect(oneTime).toMatchObject(
					year === eventYear
						? [{ title: { en: "تولد" }, color: "cyan", isHolidayInIran: true }]
						: [],
				);
				expect(recurring).toMatchObject([
					{ title: { en: "دورهمی" }, color: "green", isHolidayInIran: true },
				]);
			}
		},
	);

	it("matches Gregorian dates and follows the configured Hijri calculation base", () => {
		const gregorian = parseVaultEventsNote("06-15 | Meetup", {
			...source,
			calendar: "gregorian",
		});
		const hijri = parseVaultEventsNote("1446-09-01 | Ramadan", {
			...source,
			id: "observances",
			calendar: "hijri",
		});
		expect(
			dateToEvents(gregorianToCalendarDate(2025, 6, 15), { customEvents: gregorian })[0].title.en,
		).toBe("Meetup");

		const iran = hijriToCalendarDate(1446, 9, 1, { base: "iran" });
		const umalqura = hijriToCalendarDate(1446, 9, 1, { base: "umalqura" });
		expect(iran.compare(umalqura)).not.toBe(0);
		expect(dateToEvents(iran, { customEvents: hijri, hijriBase: "iran" })[0].title.en).toBe(
			"Ramadan",
		);
		expect(dateToEvents(iran, { customEvents: hijri, hijriBase: "umalqura" })).toEqual([]);
		expect(dateToEvents(umalqura, { customEvents: hijri, hijriBase: "umalqura" })[0].title.en).toBe(
			"Ramadan",
		);
	});
});

it("limits a one-time holiday to its year in checkHoliday and calendar grid highlighting", () => {
	const otherYear = jalaliToCalendarDate(1405, 5, 12);
	expect(checkHoliday(holiday, { customEvents })).toBe(true);
	expect(checkHoliday(otherYear, { customEvents })).toBe(false);
	expect(checkHoliday(regularDay, { customEvents })).toBe(false);
	expect(checkHoliday(holiday, { customEvents, showCustomEvents: false })).toBe(false);

	const state = new CalendarState({ jYear: 1404, jMonth: 5 });
	const setting = { ...DEFAULT_SETTING };
	const grid = new GridService(state, setting, () => customEvents);
	const cell = (day: number, year = 1404) =>
		grid.buildMonthGrid(year, 5).find((value) => value.isInCurrentMonth && value.jd === day);
	expect(cell(12)?.isHolidayInIran).toBe(true);
	expect(cell(12, 1405)?.isHolidayInIran).toBe(false);
	expect(cell(13)?.isHolidayInIran).toBe(false);
	setting.showCustomEvents = false;
	expect(cell(12)?.isHolidayInIran).toBe(false);
	setting.showCustomEvents = true;
	expect(cell(12)?.isHolidayInIran).toBe(true);
});

it("uses native theme variables on individual custom tooltip borders and preserves holiday styling", () => {
	const setProperties = Array.from({ length: 5 }, () => vi.fn());
	const createDiv = vi.fn();
	for (const setProperty of setProperties) {
		createDiv.mockReturnValueOnce({ style: { setProperty } });
	}
	const tooltipEl = { replaceChildren: vi.fn(), createDiv };
	const wrapper = { setAttribute: vi.fn(), querySelector: () => tooltipEl };
	vi.stubGlobal("activeDocument", { querySelector: () => wrapper });
	vi.stubGlobal("MouseEvent", class {});
	try {
		const events = dateToEvents(holiday, {
			customEvents: parseVaultEventsNote(
				"05-12 | تولد | green | تعطیل\n05-12 | دورهمی | orange\n05-12 | دیدار\n05-12 | جشن | brown",
				source,
			),
		});
		const [builtIn] = dateToEvents(jalaliToCalendarDate(1404, 1, 1), {
			showEvents: { showIROfficialEvents: true },
		});
		new Tooltip().showTooltip(
			new Event("touchstart") as unknown as TouchEvent,
			[...events, builtIn],
			"fa",
		);
		expect(wrapper.setAttribute).toHaveBeenCalledWith("dir", "rtl");
		expect(createDiv).toHaveBeenNthCalledWith(1, {
			text: "تولد",
			cls: [
				"persian-calendar__tooltip-event",
				"persian-calendar__tooltip-event--custom",
				"persian-calendar__day--holiday",
			],
		});
		expect(setProperties[0]).toHaveBeenCalledWith(
			"--persian-calendar-tooltip-event-accent",
			"var(--color-green)",
		);
		expect(setProperties[1]).toHaveBeenCalledWith(
			"--persian-calendar-tooltip-event-accent",
			"var(--color-orange)",
		);
		for (const setProperty of setProperties.slice(2)) {
			expect(setProperty).not.toHaveBeenCalled();
		}
	} finally {
		vi.unstubAllGlobals();
	}
});

it("exposes repository events and holidays to the API and event placeholders", () => {
	const setting = { ...DEFAULT_SETTING, ...allEventsOff, showCustomEvents: true };
	const api = new ApiService(
		() => setting,
		() => customEvents,
	).build();
	const date = calendarDateToDate(holiday);
	const plugin = { setting, getAllCustomEvents: () => customEvents } as PersianCalendarPlugin;
	const placeholder = new Placeholder(plugin);
	const context = {
		currentDate: holiday,
		fileName: "1404-05-12",
		fileDate: holiday,
		baseDate: "jalali",
	} as const;

	expect(api.checkHoliday(date)).toBe(true);
	expect(api.dateToEvents(date).filter((event) => event.isCustom)).toMatchObject([
		{ title: { en: "تولد" }, isHolidayInIran: true },
	]);
	for (const key of ["{{مناسبت جاری}}", "{{مناسبت یادداشت}}"]) {
		expect(placeholder.getPlaceholderMap(context).get(key)).toBe("- تولد (تعطیل)");
	}
	expect(eventsToString(dateToEvents(regularDay, { customEvents }))).toBe("- دورهمی");

	setting.showCustomEvents = false;
	expect(api.checkHoliday(date)).toBe(false);
	expect(api.dateToEvents(date).filter((event) => event.isCustom)).toEqual([]);
	expect(placeholder.getPlaceholderMap(context).get("{{مناسبت جاری}}")).toBe(eventsToString([]));
	expect(placeholder.getPlaceholderMap(context).get("{{مناسبت یادداشت}}")).toBe(eventsToString([]));
});
