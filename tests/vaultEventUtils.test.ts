import { setAdapter } from "persian-holidays";
import type { TVaultEventSource } from "src/types";
import { gregorianToCalendarDate, jalaliToCalendarDate } from "src/utils/dateUtils";
import { dateToEvents } from "src/utils/eventUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";
import {
	extractEventsFromFrontmatter,
	matchesVaultSourcePath,
	parseRecurringDate,
	parseVaultEventsNote,
} from "src/utils/vaultEventUtils";

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

describe("parseRecurringDate", () => {
	it("auto-detects Jalali and Gregorian dates and normalizes Persian digits", () => {
		expect(parseRecurringDate("1375-06-12", "auto")).toEqual({
			calendar: "jalali",
			month: 6,
			day: 12,
			originYear: 1375,
		});

		expect(parseRecurringDate("۱۳۷۵/۰۶/۱۲", "auto")).toEqual({
			calendar: "jalali",
			month: 6,
			day: 12,
			originYear: 1375,
		});

		expect(parseRecurringDate("1996-09-02T10:30:00Z", "auto")).toEqual({
			calendar: "gregorian",
			month: 9,
			day: 2,
			originYear: 1996,
		});
	});

	it("parses yearless recurring dates and Date objects", () => {
		expect(parseRecurringDate("06-12", "auto", "jalali")).toEqual({
			calendar: "jalali",
			month: 6,
			day: 12,
		});

		expect(parseRecurringDate("09/01", "hijri")).toEqual({
			calendar: "hijri",
			month: 9,
			day: 1,
		});

		expect(parseRecurringDate(new Date(2000, 7, 15), "auto")).toEqual({
			calendar: "gregorian",
			month: 8,
			day: 15,
			originYear: 2000,
		});
	});

	it("rejects invalid dates", () => {
		expect(parseRecurringDate("not-a-date", "auto")).toBeNull();
		expect(parseRecurringDate("1375-13-01", "auto")).toBeNull();
		expect(parseRecurringDate("1375-06-32", "auto")).toBeNull();
		expect(parseRecurringDate("", "auto")).toBeNull();
		expect(parseRecurringDate(null, "auto")).toBeNull();
	});
});

describe("matchesVaultSourcePath", () => {
	it("matches folder prefixes, exact note paths, and empty vault-wide paths", () => {
		expect(matchesVaultSourcePath("People/Ali.md", "")).toBe(true);
		expect(matchesVaultSourcePath("People/Ali.md", "People/")).toBe(true);
		expect(matchesVaultSourcePath("People/Team/Sara.md", "People")).toBe(true);
		expect(matchesVaultSourcePath("PeopleOther/Ali.md", "People/")).toBe(false);
		expect(matchesVaultSourcePath("Occasions.md", "Occasions.md")).toBe(true);
		expect(matchesVaultSourcePath("Other/Occasions.md", "Occasions.md")).toBe(false);
	});
});

describe("extractEventsFromFrontmatter", () => {
	const baseSource: TVaultEventSource = {
		id: "src-1",
		type: "frontmatter",
		path: "People/",
		property: "birthday",
		calendar: "auto",
		isHoliday: false,
		enabled: true,
	};

	it("extracts recurring annual events from frontmatter and matches across years", () => {
		const events = extractEventsFromFrontmatter({
			filePath: "People/Ali Rezaei.md",
			fileBasename: "Ali Rezaei",
			frontmatter: { birthday: "1375-06-12" },
			source: baseSource,
		});

		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			title: "Ali Rezaei (birthday)",
			calendar: "jalali",
			month: 6,
			day: 12,
			isHoliday: false,
			enabled: true,
		});
		expect(events[0].year).toBeUndefined();

		const matched1404 = dateToEvents(jalaliToCalendarDate(1404, 6, 12), {
			showEvents: { showCustomEvents: true },
			customEvents: events,
		});
		expect(matched1404.map((e) => e.title.en)).toEqual(["Ali Rezaei (birthday)"]);

		const matched1405 = dateToEvents(jalaliToCalendarDate(1405, 6, 12), {
			showEvents: { showCustomEvents: true },
			customEvents: events,
		});
		expect(matched1405.map((e) => e.title.en)).toEqual(["Ali Rezaei (birthday)"]);
	});

	it("formats titleTemplate and supports array frontmatter values", () => {
		const events = extractEventsFromFrontmatter({
			filePath: "People/Sara.md",
			fileBasename: "Sara",
			frontmatter: { birthday: ["1380-01-15", "2020-05-01"] },
			source: {
				...baseSource,
				titleTemplate: "تولد {name} ({year})",
				isHoliday: true,
			},
		});

		expect(events.map((e) => e.title)).toEqual(["تولد Sara (1380)", "تولد Sara (2020)"]);
		expect(events[0].isHoliday).toBe(true);
		expect(events[1].calendar).toBe("gregorian");
	});

	it("ignores disabled sources and non-matching folders", () => {
		expect(
			extractEventsFromFrontmatter({
				filePath: "Notes/Ali.md",
				fileBasename: "Ali",
				frontmatter: { birthday: "1375-06-12" },
				source: baseSource,
			}),
		).toEqual([]);

		expect(
			extractEventsFromFrontmatter({
				filePath: "People/Ali.md",
				fileBasename: "Ali",
				frontmatter: { birthday: "1375-06-12" },
				source: { ...baseSource, enabled: false },
			}),
		).toEqual([]);
	});
});

describe("parseVaultEventsNote", () => {
	const noteSource: TVaultEventSource = {
		id: "note-1",
		type: "note",
		path: "Occasions.md",
		calendar: "auto",
		isHoliday: false,
		enabled: true,
	};

	it("parses recurring event lines from a markdown note and preserves Persian title digits", () => {
		const content = `---
tags: [events]
---
# Family Occasions
%% comment %%
- 1375-06-12 | تولد ۲۵ سالگی علی
* 06-15 تولد مریم
- [ ] 2025-03-21 - Spring Equinox
- hijri:09-01 | شروع رمضان
- [gregorian] 12-25 | Christmas
`;

		const events = parseVaultEventsNote(content, noteSource, "jalali");
		expect(events).toHaveLength(5);
		expect(events[0]).toMatchObject({
			title: "تولد ۲۵ سالگی علی",
			calendar: "jalali",
			month: 6,
			day: 12,
		});
		expect(events[1]).toMatchObject({
			title: "تولد مریم",
			calendar: "jalali",
			month: 6,
			day: 15,
		});
		expect(events[2]).toMatchObject({
			title: "Spring Equinox",
			calendar: "gregorian",
			month: 3,
			day: 21,
		});
		expect(events[3]).toMatchObject({
			title: "شروع رمضان",
			calendar: "hijri",
			month: 9,
			day: 1,
		});
		expect(events[4]).toMatchObject({
			title: "Christmas",
			calendar: "gregorian",
			month: 12,
			day: 25,
		});

		const gregMatched = dateToEvents(gregorianToCalendarDate(2026, 3, 21), {
			showEvents: { showCustomEvents: true },
			customEvents: events,
		});
		expect(gregMatched.map((e) => e.title.en)).toEqual(["Spring Equinox"]);
	});
});
