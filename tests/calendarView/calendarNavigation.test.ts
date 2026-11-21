import CalendarNavigation from "src/templates/CalendarView/CalendarRenderer/CalendarNavigation";
import CalendarState from "src/templates/CalendarView/CalendarState";
import { describe, expect, it, vi } from "vitest";

describe("CalendarNavigation", () => {
	it("changes month forward and backward and triggers rerender", () => {
		const state = new CalendarState({ jYear: 1405, jMonth: 8 });
		const rerender = vi.fn();
		const navigation = new CalendarNavigation(state, rerender);

		navigation.changeMonth("next");
		expect(state.getJState()).toEqual({ jYearState: 1405, jMonthState: 9 });
		expect(rerender).toHaveBeenCalledTimes(1);

		navigation.changeMonth("prev");
		expect(state.getJState()).toEqual({ jYearState: 1405, jMonthState: 8 });
		expect(rerender).toHaveBeenCalledTimes(2);
	});

	it("changes year forward and backward while preserving the month", () => {
		const state = new CalendarState({ jYear: 1405, jMonth: 8 });
		const rerender = vi.fn();
		const navigation = new CalendarNavigation(state, rerender);

		navigation.changeYear("next");
		expect(state.getJState()).toEqual({ jYearState: 1406, jMonthState: 8 });
		expect(rerender).toHaveBeenCalledTimes(1);

		navigation.changeYear("prev");
		navigation.changeYear("prev");
		expect(state.getJState()).toEqual({ jYearState: 1404, jMonthState: 8 });
		expect(rerender).toHaveBeenCalledTimes(3);
	});
});
