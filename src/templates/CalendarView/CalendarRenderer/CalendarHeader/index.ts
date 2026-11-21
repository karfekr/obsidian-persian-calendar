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
		const isFa = this.setting.language === "fa";

		const headerTopEl = headerEl.createDiv({
			cls: "persian-calendar__header-top",
		});

		const additionalCalendarStateEl = headerTopEl.createDiv({
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

		const currentButton = headerTopEl.createSpan({
			cls: "persian-calendar__go-current",
			text: t("current"),
		});

		currentButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const stateControlEl = headerEl.createDiv({
			cls: "persian-calendar__state-control",
		});

		this.createNavArrow(stateControlEl, isFa ? "chevrons-right" : "chevrons-left", () => {
			this.navigation.changeYear("prev");
		});

		this.createNavArrow(stateControlEl, isFa ? "chevron-right" : "chevron-left", () => {
			this.navigation.changeMonth("prev");
		});

		const jalaliStateEl = stateControlEl.createDiv({
			cls: "persian-calendar__jalali-state",
		});

		const monthEl = jalaliStateEl.createSpan({
			cls: [
				"persian-calendar__jmonth",
				isFa ? "persian-calendar__jmonth--fa" : "persian-calendar__jmonth--en",
			],
		});

		const yearEl = jalaliStateEl.createSpan({
			cls: [
				"persian-calendar__jyear",
				isFa ? "persian-calendar__jyear--fa" : "persian-calendar__jyear--en",
			],
			text: isFa ? toFaNumber(jYearState) : String(jYearState),
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

		this.createNavArrow(stateControlEl, isFa ? "chevron-left" : "chevron-right", () => {
			this.navigation.changeMonth("next");
		});

		this.createNavArrow(stateControlEl, isFa ? "chevrons-left" : "chevrons-right", () => {
			this.navigation.changeYear("next");
		});
	}

	private createNavArrow(containerEl: HTMLElement, icon: string, onClick: () => void) {
		const arrowEl = containerEl.createSpan({
			cls: "persian-calendar__arrow",
		});
		setIcon(arrowEl, icon);
		arrowEl.addEventListener("click", onClick);
		return arrowEl;
	}
}
