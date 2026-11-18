import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";
import { GREGORIAN_MONTHS_NAME, HIJRI_MONTHS_NAME, JALALI_MONTHS_NAME } from "src/constants";
import { getDirection, t } from "src/languages";
import type { TCustomEvent, TDateFormat, THijriBase, TLocale } from "src/types";
import {
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianMonthLength,
	hijriMonthLength,
	jalaliMonthLength,
	todayTehran,
} from "src/utils/dateUtils";

type CustomEventModalOptions = {
	language: TLocale;
	hijriBase: THijriBase;
	event?: TCustomEvent;
	onSave: (event: TCustomEvent) => void | Promise<void>;
};

function generateEventId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default class CustomEventModal extends Modal {
	private readonly options: CustomEventModalOptions;
	private titleValue: string;
	private calendarValue: TDateFormat;
	private repeatEveryYear: boolean;
	private yearValue: string;
	private monthValue: number;
	private dayValue: string;
	private isHoliday: boolean;
	private errorEl: HTMLElement | null = null;

	constructor(app: App, options: CustomEventModalOptions) {
		super(app);
		this.options = options;

		const today = todayTehran();
		const { jy, jm, jd } = dateToJalali(today);

		if (options.event) {
			this.titleValue = options.event.title;
			this.calendarValue = options.event.calendar;
			this.repeatEveryYear = options.event.year === undefined;
			this.yearValue = String(options.event.year ?? this.getDefaultYear(options.event.calendar));
			this.monthValue = options.event.month;
			this.dayValue = String(options.event.day);
			this.isHoliday = options.event.isHoliday;
		} else {
			this.titleValue = "";
			this.calendarValue = "jalali";
			this.repeatEveryYear = true;
			this.yearValue = String(jy);
			this.monthValue = jm;
			this.dayValue = String(jd);
			this.isHoliday = false;
		}
	}

	private getDefaultYear(calendar: TDateFormat): number {
		const today = todayTehran();
		switch (calendar) {
			case "jalali":
				return dateToJalali(today).jy;
			case "gregorian":
				return dateToGregorian(today).gy;
			case "hijri":
				return dateToHijri(today, { base: this.options.hijriBase }).hy;
		}
	}

	private getMonthNames(calendar: TDateFormat): Record<number, string> {
		const lang = this.options.language;
		switch (calendar) {
			case "jalali":
				return JALALI_MONTHS_NAME[lang];
			case "gregorian":
				return GREGORIAN_MONTHS_NAME[lang];
			case "hijri":
				return HIJRI_MONTHS_NAME[lang];
		}
	}

	private getMaxDaysInMonth(): number {
		const parsedYear = Number.parseInt(this.yearValue, 10);
		const hasValidYear = !this.repeatEveryYear && Number.isInteger(parsedYear) && parsedYear > 0;

		switch (this.calendarValue) {
			case "jalali":
				return jalaliMonthLength(hasValidYear ? parsedYear : 1403, this.monthValue) || 30;
			case "gregorian":
				return gregorianMonthLength(hasValidYear ? parsedYear : 2024, this.monthValue) || 31;
			case "hijri":
				return hasValidYear
					? hijriMonthLength(parsedYear, this.monthValue, { base: this.options.hijriBase }) || 30
					: 30;
		}
	}

	onOpen(): void {
		this.containerEl.addClass("persian-calendar");
		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.setAttribute("dir", getDirection());
		contentEl.addClass("persian-calendar__custom-event-modal");

		const isEdit = Boolean(this.options.event);
		contentEl.createEl("h2", {
			text: isEdit ? t("modal.customEvent.editTitle") : t("modal.customEvent.addTitle"),
		});

		new Setting(contentEl).setName(t("modal.customEvent.titleLabel")).addText((text) => {
			text
				.setPlaceholder(t("modal.customEvent.titlePlaceholder"))
				.setValue(this.titleValue)
				.onChange((value) => {
					this.titleValue = value;
					this.clearError();
				});
			text.inputEl.focus();
		});

		new Setting(contentEl).setName(t("modal.customEvent.calendarLabel")).addDropdown((dropdown) => {
			dropdown
				.addOption("jalali", t("setting.events.custom.calendars.jalali"))
				.addOption("gregorian", t("setting.events.custom.calendars.gregorian"))
				.addOption("hijri", t("setting.events.custom.calendars.hijri"))
				.setValue(this.calendarValue)
				.onChange((value) => {
					this.calendarValue = value as TDateFormat;
					this.yearValue = String(this.getDefaultYear(this.calendarValue));
					this.render();
				});
		});

		new Setting(contentEl).setName(t("modal.customEvent.repeatLabel")).addToggle((toggle) => {
			toggle.setValue(this.repeatEveryYear).onChange((value) => {
				this.repeatEveryYear = value;
				this.render();
			});
		});

		if (!this.repeatEveryYear) {
			new Setting(contentEl).setName(t("modal.customEvent.yearLabel")).addText((text) => {
				text.inputEl.type = "number";
				text.setValue(this.yearValue).onChange((value) => {
					this.yearValue = value;
					this.clearError();
				});
			});
		}

		const months = this.getMonthNames(this.calendarValue);
		new Setting(contentEl).setName(t("modal.customEvent.monthLabel")).addDropdown((dropdown) => {
			for (let month = 1; month <= 12; month++) {
				dropdown.addOption(String(month), months[month] ?? String(month));
			}

			dropdown.setValue(String(this.monthValue)).onChange((value) => {
				this.monthValue = Number.parseInt(value, 10);
				this.clearError();
			});
		});

		new Setting(contentEl).setName(t("modal.customEvent.dayLabel")).addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "1";
			text.inputEl.max = String(this.getMaxDaysInMonth());
			text.setValue(this.dayValue).onChange((value) => {
				this.dayValue = value;
				this.clearError();
			});
		});

		new Setting(contentEl).setName(t("modal.customEvent.holidayLabel")).addToggle((toggle) => {
			toggle.setValue(this.isHoliday).onChange((value) => {
				this.isHoliday = value;
			});
		});

		this.errorEl = contentEl.createDiv({
			cls: "persian-calendar__custom-event-error",
		});

		const footer = contentEl.createDiv({
			cls: "persian-calendar__cmodal-container",
		});

		const cancelBtn = footer.createEl("button", {
			text: t("modal.customEvent.cancelBtn"),
			cls: "persian-calendar__cmodal-cancel",
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		const saveBtn = footer.createEl("button", {
			text: t("modal.customEvent.saveBtn"),
			cls: "persian-calendar__cmodal-confirm",
		});
		saveBtn.addEventListener("click", () => {
			void this.handleSave();
		});
	}

	private clearError(): void {
		if (this.errorEl) {
			this.errorEl.textContent = "";
		}
	}

	private showError(message: string): void {
		if (this.errorEl) {
			this.errorEl.textContent = message;
		}
	}

	private async handleSave(): Promise<void> {
		const trimmedTitle = this.titleValue.trim();
		if (!trimmedTitle) {
			this.showError(t("modal.customEvent.errors.emptyTitle"));
			return;
		}

		let year: number | undefined;
		if (!this.repeatEveryYear) {
			const parsedYear = Number.parseInt(this.yearValue, 10);
			if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 9999) {
				this.showError(t("modal.customEvent.errors.invalidYear"));
				return;
			}
			year = parsedYear;
		}

		const maxDay = this.getMaxDaysInMonth();
		const parsedDay = Number.parseInt(this.dayValue, 10);
		if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > maxDay) {
			this.showError(t("modal.customEvent.errors.invalidDay").replace("{max}", String(maxDay)));
			return;
		}

		const event: TCustomEvent = {
			id: this.options.event?.id ?? generateEventId(),
			title: trimmedTitle,
			calendar: this.calendarValue,
			month: this.monthValue,
			day: parsedDay,
			...(year !== undefined ? { year } : {}),
			isHoliday: this.isHoliday,
			enabled: this.options.event?.enabled ?? true,
		};

		await this.options.onSave(event);
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
