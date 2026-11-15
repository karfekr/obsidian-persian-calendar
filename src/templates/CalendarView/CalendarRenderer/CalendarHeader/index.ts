import { setIcon } from "obsidian";
import { t } from "src/languages";
import type { NoteService } from "src/services";
import type CalendarState from "src/templates/CalendarView/CalendarState";
import type { TSetting } from "src/types";
import { jalaliMonthToRangeDash } from "src/utils/dashUtils";
import { jalaliMonthName } from "src/utils/dateUtils";
import { toFaNumber } from "src/utils/formatters";

import type CalendarNavigation from "../CalendarNavigation";
import { openNoteContextMenu } from "../noteContextMenu";

export default class CalendarHeaderRender {
	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
		private readonly navigation: CalendarNavigation,
	) {}

	public render(containerEl: HTMLElement) {
		const headerEl = containerEl.createDiv({
			cls: "persian-calendar__header",
		});

		const { jYearState, jMonthState } = this.calendarState.getJState();

		const additionalCalendarStateEl = headerEl.createDiv({
			cls: "persian-calendar__additional-calendar-state",
		});

		const hijriMonthYearEl = additionalCalendarStateEl.createDiv({
			cls: "persian-calendar__hmonth-hyear",
		});

		const georgianMonthYearEl = additionalCalendarStateEl.createDiv({
			cls: "persian-calendar__gmonth-gyear",
		});

		if (this.setting.showGeorgianDates) {
			const georgianMonthRange = jalaliMonthToRangeDash(jYearState, jMonthState, {
				local: "en",
				dateFormat: "gregorian",
			});
			georgianMonthYearEl.textContent = georgianMonthRange;
		}

		if (this.setting.showHijriDates) {
			const hijriMonthRange = jalaliMonthToRangeDash(jYearState, jMonthState, {
				local: "fa",
				dateFormat: "hijri",
				hijriBase: this.setting.hijriBase,
			});
			hijriMonthYearEl.textContent = hijriMonthRange;
		}

		const stateControlEl = headerEl.createDiv({
			cls: "persian-calendar__state-control",
		});

		const jalaliStateEl = stateControlEl.createDiv({
			cls: "persian-calendar__jalali-state",
		});

		const monthEl = jalaliStateEl.createSpan({
			cls: [
				"persian-calendar__jmonth",
				this.setting.language === "fa"
					? "persian-calendar__jmonth--fa"
					: "persian-calendar__jmonth--en",
			],
		});

		const yearEl = jalaliStateEl.createSpan({
			cls: [
				"persian-calendar__jyear",
				this.setting.language === "fa"
					? "persian-calendar__jyear--fa"
					: "persian-calendar__jyear--en",
			],
			text: this.setting.language === "fa" ? toFaNumber(jYearState) : String(jYearState),
		});

		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateYearlyNote(jYearState);
		});

		yearEl.addEventListener("contextmenu", (e) => {
			openNoteContextMenu(e, (openMode) => {
				void this.notesService.openOrCreateYearlyNote(jYearState, openMode);
			});
		});

		const monthName = jalaliMonthName(jMonthState, this.setting.language);
		monthEl.textContent = monthName;

		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState);
		});

		monthEl.addEventListener("contextmenu", (e) => {
			openNoteContextMenu(e, (openMode) => {
				void this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState, openMode);
			});
		});

		const navContainerEl = stateControlEl.createDiv({
			cls: "persian-calendar__nav-container",
		});

		const prevMonthArrow = navContainerEl.createSpan({
			cls: "persian-calendar__arrow",
		});
		setIcon(prevMonthArrow, "square-chevron-right");

		prevMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("prev");
		});

		const currentButton = navContainerEl.createSpan({
			cls: "persian-calendar__go-current",
			text: t("current"),
		});

		currentButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const nextMonthArrow = navContainerEl.createSpan({
			cls: "persian-calendar__arrow",
		});
		setIcon(nextMonthArrow, "square-chevron-left");

		nextMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("next");
		});
	}
}
