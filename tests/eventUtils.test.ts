import { setAdapter } from "persian-holidays";
import { jalaliToDate } from "src/utils/dateUtils";
import { dateToEvents } from "src/utils/eventUtils";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

const allEventsOff = {
	showIROfficialEvents: false,
	showIRHistoricalEvents: false,
	showIRAncientEvents: false,
	showShiaEvents: false,
	showSunniEvents: false,
	showGlobalEvents: false,
};

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

describe("dateToEvents", () => {
	it("returns an empty array when all event toggles are off", () => {
		const date = jalaliToDate(1404, 1, 1);

		expect(dateToEvents(date, { showEvents: allEventsOff })).toEqual([]);
	});

	it("returns events when at least one category is enabled", () => {
		const date = jalaliToDate(1404, 1, 1);

		const events = dateToEvents(date, {
			showEvents: { ...allEventsOff, showIROfficialEvents: true },
		});

		expect(events.length).toBeGreaterThan(0);
	});
});
