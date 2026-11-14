import { CalendarDate, PersianCalendar, toCalendar } from "@internationalized/date";
import type { App } from "obsidian";
import { Modal, setIcon } from "obsidian";
import { JALALI_MONTHS_NAME, WEEKDAYS_NAME } from "src/constants";
import { t } from "src/languages";
import type { TDateFormat, TSetting } from "src/types";
import {
	dateToJalali,
	getWeekdayTehran,
	gregorianToCalendarDate,
	jalaliMonthLength,
	jalaliToCalendarDate,
	jalaliToGregorian,
	todayTehran,
} from "src/utils/dateUtils";
import { extractDayFormat, toDayFormat, toFaNumber } from "src/utils/formatters";

const persian = new PersianCalendar();

export default class DatePicker extends Modal {
	private setting: TSetting;
	private currentJalali: CalendarDate;
	private onSelect: (val: string) => void;
	private outputMode: TDateFormat;

	constructor(app: App, setting: TSetting, initial: string | null, cb: (val: string) => void) {
		super(app);

		this.setting = setting;
		this.outputMode = "gregorian";

		if (initial) {
			const parsedDate = extractDayFormat(initial);
			if (parsedDate) {
				if (parsedDate.year > 1700) {
					const gregorianDate = gregorianToCalendarDate(
						parsedDate.year,
						parsedDate.month,
						parsedDate.day,
					);
					this.currentJalali = toCalendar(gregorianDate, persian);
					this.outputMode = "gregorian";
				} else {
					const jalaliMonth = Math.min(Math.max(1, parsedDate.month), 12);
					const maxDaysInMonth = jalaliMonthLength(parsedDate.year, jalaliMonth);
					const jalaliDay = Math.min(Math.max(1, parsedDate.day), maxDaysInMonth);
					this.currentJalali = new CalendarDate(persian, parsedDate.year, jalaliMonth, jalaliDay);
					this.outputMode = "jalali";
				}
			} else {
				this.currentJalali = toCalendar(todayTehran(), persian);
				this.outputMode = "gregorian";
			}
		} else {
			this.currentJalali = toCalendar(todayTehran(), persian);
			this.outputMode = "gregorian";
		}

		this.onSelect = cb;
	}

	onOpen() {
		this.containerEl.classList.add("persian-calendar__datepicker-container", "persian-calendar");
		this.render();
	}

	private getYear(year: number): string {
		return this.setting.language === "fa" ? toFaNumber(year) : String(year);
	}

	private getMonthName(month: number): string {
		const language = this.setting.language;
		return JALALI_MONTHS_NAME[language][month];
	}

	private getWeekdayLetters(): string[] {
		const language = this.setting.language;
		const weekdaysMap = WEEKDAYS_NAME[language];
		const letters: string[] = [];

		for (let dayIndex = 1; dayIndex <= 7; dayIndex++) {
			const dayName = weekdaysMap[dayIndex] ?? "";
			letters.push(dayName.charAt(0));
		}

		return letters;
	}

	private render() {
		const { contentEl } = this;
		contentEl.replaceChildren();

		const rootContainer = contentEl.createDiv({
			cls: "persian-calendar__datepicker",
		});
		rootContainer.setAttribute("dir", "rtl");

		this.renderHeader(rootContainer);
		this.renderCalendarGrid(rootContainer);
		this.renderFooter(rootContainer);
	}

	private renderHeader(container: HTMLElement) {
		const header = container.createDiv({
			cls: "persian-calendar__datepicker-header",
		});

		// Previous year button
		const prevYearButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});

		setIcon(prevYearButton, "chevrons-right");

		prevYearButton.onclick = () => {
			this.shiftYear(-1);
		};

		// Previous month button
		const prevMonthButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});

		setIcon(prevMonthButton, "chevron-right");

		prevMonthButton.onclick = () => {
			this.shiftMonth(-1);
		};

		// Month and year title
		header.createSpan({
			cls: "persian-calendar__datepicker-jmonth",
			text: `${this.getMonthName(this.currentJalali.month)} ${this.getYear(this.currentJalali.year)}`,
		});

		// Next month button
		const nextMonthButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});

		setIcon(nextMonthButton, "chevron-left");

		nextMonthButton.onclick = () => {
			this.shiftMonth(1);
		};

		// Next year button
		const nextYearButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});

		setIcon(nextYearButton, "chevrons-left");

		nextYearButton.onclick = () => {
			this.shiftYear(1);
		};
	}

	private renderCalendarGrid(container: HTMLElement) {
		const grid = container.createDiv({
			cls: "persian-calendar__datepicker-days",
		});

		grid.setAttribute("role", "grid");

		this.getWeekdayLetters().forEach((weekdayLetter) => {
			const weekdayEl = grid.createSpan({
				cls: "persian-calendar__datepicker-weekday",
				text: weekdayLetter,
			});

			weekdayEl.setAttribute("role", "columnheader");
		});

		const firstDayJavascript = getWeekdayTehran(
			jalaliToCalendarDate(this.currentJalali.year, this.currentJalali.month, 1),
		);

		const startDayOffset = (firstDayJavascript + 1) % 7;

		const previousMonth = this.currentJalali;
		const previousMonthLength = jalaliMonthLength(previousMonth.year, previousMonth.month);

		const currentMonthLength = jalaliMonthLength(this.currentJalali.year, this.currentJalali.month);

		const totalCells = 42;
		const currentMonthCells = currentMonthLength;
		const previousMonthCells = startDayOffset;
		const nextMonthCells = totalCells - previousMonthCells - currentMonthCells;

		for (let i = previousMonthCells - 1; i >= 0; i--) {
			const dayNumber = previousMonthLength - i;

			const button = grid.createDiv({
				cls: ["persian-calendar__datepicker-day", "persian-calendar__datepicker-no-current-month"],
				text: toFaNumber(dayNumber),
			});

			button.tabIndex = -1;
		}

		const today = dateToJalali(todayTehran());

		for (let day = 1; day <= currentMonthLength; day++) {
			const isSelected = day === this.currentJalali.day;

			const isToday =
				today.jy === this.currentJalali.year &&
				today.jm === this.currentJalali.month &&
				today.jd === day;

			const classList = ["persian-calendar__datepicker-day"];

			if (isSelected) {
				classList.push("persian-calendar__datepicker-day--selected");
			}

			if (isToday) {
				classList.push("persian-calendar__datepicker-day--current");
			}

			const dayButton = grid.createDiv({
				cls: classList,
				text: toFaNumber(day),
			});

			dayButton.onclick = () => {
				this.selectDay(day);
			};
		}

		for (let day = 1; day <= nextMonthCells; day++) {
			const button = grid.createDiv({
				cls: ["persian-calendar__datepicker-day", "persian-calendar__datepicker-no-current-month"],
				text: toFaNumber(day),
			});

			button.tabIndex = -1;
		}
	}

	private renderFooter(container: HTMLElement) {
		const footer = container.createDiv({
			cls: "persian-calendar__datepicker-footer",
		});

		const toggle = footer.createDiv({
			cls: "persian-calendar__output-toggle",
		});

		const jalaliOption = toggle.createDiv({
			cls: ["persian-calendar__output-option", ...(this.outputMode === "jalali" ? ["active"] : [])],
			text: t("modal.datePicker.jalali"),
		});

		jalaliOption.onclick = () => {
			this.setOutputMode("jalali");
		};

		const gregorianOption = toggle.createDiv({
			cls: [
				"persian-calendar__output-option",
				...(this.outputMode === "gregorian" ? ["active"] : []),
			],
			text: t("modal.datePicker.gregorian"),
		});

		gregorianOption.onclick = () => {
			this.setOutputMode("gregorian");
		};

		const currentButton = footer.createEl("button", {
			cls: "persian-calendar__go-current",
			text: t("current"),
			type: "button",
		});

		currentButton.onclick = () => {
			this.goToCurrent();
		};
	}

	private setOutputMode(mode: TDateFormat) {
		this.outputMode = mode;
		this.render();
	}

	private selectDay(day: number) {
		this.currentJalali = this.currentJalali.set({ day });
		const gregorianDate = jalaliToGregorian(this.currentJalali.year, this.currentJalali.month, day);

		const formattedOutput =
			this.outputMode === "gregorian"
				? toDayFormat(gregorianDate.gy, gregorianDate.gm, gregorianDate.gd)
				: toDayFormat(this.currentJalali.year, this.currentJalali.month, day);

		this.onSelect(formattedOutput);
		this.close();
	}

	private goToCurrent() {
		this.currentJalali = toCalendar(todayTehran(), persian);
		this.render();
	}

	private shiftMonth(delta: number) {
		this.currentJalali = this.currentJalali.add({ months: delta });
		this.render();
	}

	private shiftYear(delta: number) {
		this.currentJalali = this.currentJalali.add({ years: delta });
		this.render();
	}
}
