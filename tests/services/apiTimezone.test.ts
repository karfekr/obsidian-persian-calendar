import { CalendarDate, parseDate } from "@internationalized/date";
import { setAdapter } from "persian-holidays";
import ApiService from "src/services/ApiService";
import {
	calendarDateFromDate,
	calendarDateToDate,
	nowTehran,
	TEHRAN_TZ,
	todayTehran,
} from "src/utils/dateUtils/tehran";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

beforeAll(() => setAdapter(setDefaultEventAdapter()));
afterEach(() => vi.useRealTimers());

it.each([
	["2025-03-20T20:29:59.123Z", { gy: 2025, gm: 3, gd: 20 }, { jy: 1403, jm: 12, jd: 30 }],
	["2025-03-20T20:30:00.123Z", { gy: 2025, gm: 3, gd: 21 }, { jy: 1404, jm: 1, jd: 1 }],
	["2025-12-31T20:30:00.000Z", { gy: 2026, gm: 1, gd: 1 }, { jy: 1404, jm: 10, jd: 11 }],
] as const)(
	"interprets public native Date inputs in Tehran without changing %s",
	(iso, gregorian, jalali) => {
		const api = new ApiService().build();
		const instant = new Date(iso);
		const original = instant.getTime();
		expect(api.dateToGregorian(instant)).toEqual(gregorian);
		expect(api.dateToJalali(instant)).toEqual(jalali);
		expect(api.dateToHijri(instant)).toEqual(
			api.gregorianToHijri(gregorian.gy, gregorian.gm, gregorian.gd),
		);
		expect(api.dateToHijri(instant, { base: "umalqura" })).toEqual(
			api.gregorianToHijri(gregorian.gy, gregorian.gm, gregorian.gd, { base: "umalqura" }),
		);
		expect(() => api.checkHoliday(instant)).not.toThrow();
		expect(Array.isArray(api.dateToEvents(instant))).toBe(true);
		expect(instant.getTime()).toBe(original);
	},
);

it("retains public conversion method names, Date results and UTC-noon timestamps", () => {
	const api = new ApiService().build();
	const expected = "2025-03-21T12:00:00.000Z";
	const g = api.gregorianToDate(2025, 3, 21);
	const j = api.jalaliToDate(1404, 1, 1);
	expect(g).toBeInstanceOf(Date);
	expect(j).toBeInstanceOf(Date);
	expect(g.toISOString()).toBe(expected);
	expect(j.toISOString()).toBe(expected);
	for (const base of ["iran", "umalqura"] as const) {
		const h = api.gregorianToHijri(2025, 3, 21, { base });
		expect(api.hijriToDate(h.hy, h.hm, h.hd, { base }).toISOString()).toBe(expected);
	}
	expect(calendarDateFromDate(g)).toBeInstanceOf(CalendarDate);
	expect(calendarDateToDate(parseDate("2025-03-21")).toISOString()).toBe(expected);
});

it("represents current time as a ZonedDateTime and today's date as a CalendarDate", () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2025-03-20T20:30:00.123Z"));
	const instant = nowTehran();
	expect(instant.timeZone).toBe(TEHRAN_TZ);
	expect(instant.toDate().getTime()).toBe(Date.now());
	expect(instant).toMatchObject({
		year: 2025,
		month: 3,
		day: 21,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 123,
	});
	expect(todayTehran()).toBeInstanceOf(CalendarDate);
	expect(todayTehran().toString()).toBe("2025-03-21");
	expect("hour" in todayTehran()).toBe(false);
});
