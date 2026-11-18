import type { SettingDefinitionItem } from "obsidian";
import { Setting } from "obsidian";
import CustomEventModal from "src/components/CustomEventModal";
import { GREGORIAN_MONTHS_NAME, HIJRI_MONTHS_NAME, JALALI_MONTHS_NAME } from "src/constants";
import { t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TCustomEvent, TDateFormat, TLocale } from "src/types";

function getMonthName(calendar: TDateFormat, month: number, language: TLocale): string {
	switch (calendar) {
		case "jalali":
			return JALALI_MONTHS_NAME[language][month] ?? String(month);
		case "gregorian":
			return GREGORIAN_MONTHS_NAME[language][month] ?? String(month);
		case "hijri":
			return HIJRI_MONTHS_NAME[language][month] ?? String(month);
	}
}

function formatCustomEventMeta(event: TCustomEvent, language: TLocale): string {
	const calendarLabel = t(`setting.events.custom.calendars.${event.calendar}`);
	const monthName = getMonthName(event.calendar, event.month, language);
	const datePart =
		event.year !== undefined
			? `${event.year}/${event.month}/${event.day}`
			: `${event.day} ${monthName}`;
	const recurrenceLabel =
		event.year !== undefined
			? t("setting.events.custom.oneTime")
			: t("setting.events.custom.annual");

	const parts = [calendarLabel, datePart, recurrenceLabel];
	if (event.isHoliday) {
		parts.push(t("setting.events.custom.holiday"));
	}

	return parts.join(" · ");
}

export function getEventSettings(
	plugin: PersianCalendarPlugin,
	onCustomEventsChange: (events: TCustomEvent[]) => Promise<void>,
): SettingDefinitionItem[] {
	const openEventModal = (existingEvent?: TCustomEvent) => {
		new CustomEventModal(plugin.app, {
			language: plugin.setting.language,
			hijriBase: plugin.setting.hijriBase,
			event: existingEvent,
			onSave: async (savedEvent) => {
				const current = plugin.setting.customEvents ?? [];
				const updated = existingEvent
					? current.map((item) => (item.id === savedEvent.id ? savedEvent : item))
					: [...current, savedEvent];
				await onCustomEventsChange(updated);
			},
		}).open();
	};

	return [
		{
			type: "group",
			heading: t("setting.sections.events"),
			items: [
				{
					name: t("setting.events.official.name"),
					control: { type: "toggle", key: "showIROfficialEvents" },
				},
				{
					name: t("setting.events.global.name"),
					control: { type: "toggle", key: "showGlobalEvents" },
				},
				{
					name: t("setting.events.historical.name"),
					control: { type: "toggle", key: "showIRHistoricalEvents" },
				},
				{
					name: t("setting.events.ancient.name"),
					control: { type: "toggle", key: "showIRAncientEvents" },
				},
				{
					name: t("setting.events.shia.name"),
					control: { type: "toggle", key: "showShiaEvents" },
				},
				{
					name: t("setting.events.sunni.name"),
					control: { type: "toggle", key: "showSunniEvents" },
				},
				{
					name: t("setting.events.custom.name"),
					control: { type: "toggle", key: "showCustomEvents" },
				},
			],
		},
		{
			type: "group",
			heading: t("setting.events.custom.heading"),
			items: [
				{
					name: "",
					searchable: false,
					render: (setting: Setting) => {
						setting.settingEl.empty();
						setting.settingEl.addClass("persian-calendar-custom-events");

						const headerSetting = new Setting(setting.settingEl)
							.setName(t("setting.events.custom.heading"))
							.addButton((btn) => {
								btn
									.setButtonText(t("setting.events.custom.addBtn"))
									.setCta()
									.onClick(() => {
										openEventModal();
									});
							});
						headerSetting.settingEl.addClass("persian-calendar-custom-events__header");

						const listEl = setting.settingEl.createDiv({
							cls: "persian-calendar-custom-events__list",
						});

						const events = plugin.setting.customEvents ?? [];
						if (events.length === 0) {
							listEl.createDiv({
								cls: "persian-calendar-custom-events__empty",
								text: t("setting.events.custom.empty"),
							});
							return;
						}

						for (const event of events) {
							const itemSetting = new Setting(listEl)
								.setName(event.title)
								.setDesc(formatCustomEventMeta(event, plugin.setting.language))
								.addToggle((toggle) => {
									toggle.setValue(event.enabled).onChange(async (value) => {
										const updated = events.map((item) =>
											item.id === event.id ? { ...item, enabled: value } : item,
										);
										await onCustomEventsChange(updated);
									});
								})
								.addExtraButton((btn) => {
									btn
										.setIcon("pencil")
										.setTooltip(t("setting.events.custom.edit"))
										.onClick(() => {
											openEventModal(event);
										});
								})
								.addExtraButton((btn) => {
									btn
										.setIcon("trash")
										.setTooltip(t("setting.events.custom.delete"))
										.onClick(async () => {
											const updated = events.filter((item) => item.id !== event.id);
											await onCustomEventsChange(updated);
										});
								});

							itemSetting.settingEl.addClass("persian-calendar-custom-events__item");
							if (event.isHoliday) {
								itemSetting.settingEl.addClass("persian-calendar-custom-events__item--holiday");
							}
						}
					},
				},
			],
		},
	];
}
