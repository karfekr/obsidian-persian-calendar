import { setIcon } from "obsidian";
import { Notice } from "src/components";
import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import { getDirection, t } from "src/languages";
import { NoteService } from "src/services";
import CalendarState from "src/templates/CalendarView/CalendarState";
import type { TLocal, TSetting } from "src/types";
import { jalaliToSeason } from "src/utils/dateUtils";
import { dateToEvents } from "src/utils/eventUtils";
import { toArNumber, toFaNumber } from "src/utils/formatters";

import CalendarNavigation from "../CalendarNavigation";
import GridService from "./GridService";
import Tooltip from "./Tooltip";

export default class CalendarBodyRender {
	private readonly tooltip: Tooltip;
	private readonly gridService: GridService;

	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
		private readonly onRefresh: () => Promise<void> | void,
		private readonly navigation: CalendarNavigation,
	) {
		this.tooltip = new Tooltip();
		this.gridService = new GridService(calendarState, setting);
	}

	public renderContent(contentEl: HTMLElement, _local: TLocal = "fa") {
		const { jYearState, jMonthState } = this.calendarState.getJState();
		this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState });
	}

	public renderSeasonalNotesRow(containerEl: HTMLElement, local: TLocal = "fa") {
		const seasonsRow = containerEl.createEl("div", { cls: "persian-calendar__seasons-row" });
		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = this.notesService.getSeasonsWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = seasonsRow.createEl("div", {
				cls: `persian-calendar__season${
					seasonNumber === seasonState ? " persian-calendar__season--current" : ""
				}`,
			});

			seasonEl.textContent = seasons[seasonNumber];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.addClass("persian-calendar__season--no-note");
			}

			seasonEl.addEventListener("click", () => {
				void this.notesService.openOrCreateSeasonalNote(jYearState, seasonNumber);
			});
		}
	}

	private renderWeekNumbers(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		let weekNumbersEl = contentEl.querySelector(".persian-calendar__week-numbers");
		if (weekNumbersEl) {
			weekNumbersEl.remove();
		}

		weekNumbersEl = contentEl.createEl("div", {
			cls: "persian-calendar__week-numbers",
		});

		const weekHeader = weekNumbersEl.createEl("div", {
			cls: "persian-calendar__refresh",
		});
		setIcon(weekHeader, "refresh-ccw");

		const iconEl = weekHeader.querySelector("svg");
		iconEl?.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.onRefresh();
			Notice(t("notice.success.refreshView"), getDirection());
		});

		const { jy, jm } = jalaliDate;

		const weeksCount = this.calendarState.getWeeksCountForMonth(jy, jm);
		contentEl.style.setProperty("--persian-calendar-weeks-count", String(weeksCount));

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(jy, jm);
		const weeksWithNotes = this.notesService.getWeeksWithNotes(jy);

		for (let i = 0; i < weekNumbers.length; i++) {
			const weekNumber = weekNumbers[i];

			const weekEl = weekNumbersEl.createEl("div", {
				cls: "persian-calendar__week-number",
			});
			weekEl.textContent = toFaNumber(weekNumber);

			if (!weeksWithNotes.includes(weekNumber)) {
				weekEl.addClass("persian-calendar__no-note");
			}

			weekEl.addEventListener("click", () => {
				void this.notesService.openOrCreateWeeklyNote(jy, weekNumber);
			});
		}
	}

	private renderDaysGrid(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		const weekdaysHeader = contentEl.createEl("div", {
			cls: "persian-calendar__weekday--container",
		});

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[this.setting.language];
		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = weekdaysHeader.createEl("div", { cls: "persian-calendar__weekday--name" });
			headerCell.textContent = shortName;
		}

		const daysWithNotesArray = this.notesService.getDaysWithNotes(jy, jm);
		const daysWithNotes = new Set(daysWithNotesArray);

		const cells = this.gridService.buildMonthGrid(jy, jm);

		const attachTooltipListeners = (dayEl: HTMLElement, date: Date) => {
			const handler = (e: MouseEvent | TouchEvent) => {
				const events = dateToEvents(date, {
					showEvents: this.setting,
					hijriBase: this.setting.hijriBase,
				});
				if (events.length > 0) {
					this.tooltip.showTooltip(e, events, this.setting.language);
				}
			};

			dayEl.addEventListener("mouseenter", handler);
			dayEl.addEventListener("mouseleave", () => {
				this.tooltip.hideTooltip();
			});

			dayEl.addEventListener(
				"touchstart",
				(e) => {
					handler(e);
				},
				{ passive: true },
			);
			dayEl.addEventListener("touchend", () => {
				this.tooltip.hideTooltip();
			});
			dayEl.addEventListener("touchcancel", () => {
				this.tooltip.hideTooltip();
			});
		};

		let gridEl = contentEl.querySelector(".persian-calendar__days");
		gridEl?.remove();
		gridEl = contentEl.createEl("div", { cls: "persian-calendar__days" });

		const activeDate = this.calendarState.getActiveJDate();

		for (const cell of cells) {
			const dayEl = gridEl.createEl("div", { cls: "persian-calendar__day" });

			const persianDateEl = dayEl.createEl("div", { cls: "persian-calendar__jalali-day" });
			persianDateEl.textContent = toFaNumber(cell.jd);

			if (!cell.isInCurrentMonth) {
				dayEl.addClass("persian-calendar__no-current-month");
			}

			if (cell.isInCurrentMonth && !daysWithNotes.has(cell.jd)) {
				dayEl.addClass("persian-calendar__no-note");
			}

			const { showGeorgianDates, showHijriDates } = this.setting;

			if (!showGeorgianDates && !showHijriDates) {
				persianDateEl.addClass("persian-calendar__jalali-day--centered");
			}

			if (cell.isInCurrentMonth) {
				if (showGeorgianDates) {
					const cls = showHijriDates
						? "persian-calendar__gregorian-day--corner"
						: "persian-calendar__gregorian-day--center";
					const georgianDateEl = dayEl.createEl("div", { cls });
					georgianDateEl.textContent = cell.gregorian.gd.toString();
				}

				if (showHijriDates) {
					const cls = showGeorgianDates
						? "persian-calendar__hijri-day--corner"
						: "persian-calendar__hijri-day--center";
					const hijriDateEl = dayEl.createEl("div", { cls });
					hijriDateEl.textContent = toArNumber(cell.hijri.hd);
				}
			}

			if (cell.isToday) {
				dayEl.addClass("persian-calendar__day--current");
			}

			if (
				activeDate &&
				cell.isInCurrentMonth &&
				cell.jy === activeDate.jy &&
				cell.jm === activeDate.jm &&
				cell.jd === activeDate.jd
			) {
				dayEl.addClass("persian-calendar__day--active");
			}

			if (cell.isHolidayInIran || cell.isWeekend) {
				dayEl.addClass("persian-calendar__day--holiday");
				dayEl
					.querySelectorAll(
						".persian-calendar__jalali-day, .persian-calendar__gregorian-day--center, .persian-calendar__hijri-day--center",
					)
					.forEach((el) => {
						el.classList.add("persian-calendar__day--holiday");
					});
			}

			dayEl.classList.add("persian-calendar__day-grid");

			dayEl.setAttr("data-day", cell.jd.toString());

			dayEl.addEventListener("click", () => {
				void this.notesService.openOrCreateDailyNote(cell.jy, cell.jm, cell.jd);

				if (!cell.isInCurrentMonth && cell.jd > 15) {
					this.navigation.changeMonth("prev");
					return;
				}

				if (!cell.isInCurrentMonth && cell.jd < 15) {
					this.navigation.changeMonth("next");
					return;
				}
			});

			if (cell.isInCurrentMonth) {
				attachTooltipListeners(dayEl, cell.date);
			}
		}
	}
}
