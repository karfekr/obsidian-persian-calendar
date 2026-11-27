import { setIcon } from "obsidian";
import { t } from "src/languages";
import type { NoteService } from "src/services";
import type CalendarState from "src/templates/CalendarView/CalendarState";
import type { TSetting } from "src/types";
import { jalaliMonthToRangeDash } from "src/utils/dashUtils";
import { dateToJalali, jalaliMonthName, todayTehran } from "src/utils/dateUtils";
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

		const today = dateToJalali(todayTehran());
		const displayedMonth = jYearState * 12 + jMonthState;
		const currentMonth = today.jy * 12 + today.jm;
		const currentButton = headerTopEl.createEl("button", {
			cls: [
				"persian-calendar__go-current",
				...(displayedMonth === currentMonth ? ["persian-calendar__go-current--hidden"] : []),
			],
			type: "button",
			attr: { "aria-label": t("noteNavigation.monthly.current") },
		});

		if (displayedMonth !== currentMonth) {
			setIcon(currentButton, displayedMonth < currentMonth ? "step-forward" : "step-back");
		}
		currentButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const stateControlEl = headerEl.createDiv({
			cls: "persian-calendar__state-control",
		});

		const previousEl = stateControlEl.createDiv({
			cls: "persian-calendar__nav-previous",
		});
		this.createNavArrow(previousEl, "chevrons-right", () => {
			this.navigation.changeYear("prev");
		});

		this.createNavArrow(previousEl, "chevron-right", () => {
			this.navigation.changeMonth("prev");
		});

		const jalaliStateEl = stateControlEl.createDiv({
			cls: "persian-calendar__jalali-state",
			attr: { dir: "auto" },
		});

		const monthEl = jalaliStateEl.createSpan({
			text: jalaliMonthName(jMonthState, this.setting.language),
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
			const file = this.notesService.getYearlyNoteFile(jYearState);
			openNoteContextMenu(
				e,
				(openMode) => {
					void this.notesService.openOrCreateYearlyNote(jYearState, openMode);
				},
				file
					? () => {
							void this.notesService.deleteYearlyNote(jYearState);
						}
					: undefined,
			);
		});

		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState);
		});

		monthEl.addEventListener("contextmenu", (e) => {
			const file = this.notesService.getMonthlyNoteFile(jYearState, jMonthState);
			openNoteContextMenu(
				e,
				(openMode) => {
					void this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState, openMode);
				},
				file
					? () => {
							void this.notesService.deleteMonthlyNote(jYearState, jMonthState);
						}
					: undefined,
			);
		});

		const nextEl = stateControlEl.createDiv({
			cls: "persian-calendar__nav-next",
		});
		this.createNavArrow(nextEl, "chevron-left", () => {
			this.navigation.changeMonth("next");
		});

		this.createNavArrow(nextEl, "chevrons-left", () => {
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
