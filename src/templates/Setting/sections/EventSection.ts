import type { SettingDefinitionItem } from "obsidian";
import { Setting } from "obsidian";
import CustomEventModal from "src/components/CustomEventModal";
import VaultEventModal from "src/components/VaultEventModal";
import { GREGORIAN_MONTHS_NAME, HIJRI_MONTHS_NAME, JALALI_MONTHS_NAME } from "src/constants";
import { t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TCustomEvent, TDateFormat, TLocale, TVaultEventSource } from "src/types";

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

function formatVaultSourceTitle(source: TVaultEventSource): string {
	if (source.type === "note") {
		return source.path;
	}

	const pathLabel = source.path.trim() || t("setting.events.vault.allVault");
	return source.property ? `${pathLabel} · ${source.property}` : pathLabel;
}

function formatVaultSourceMeta(source: TVaultEventSource): string {
	const typeLabel = t(`setting.events.vault.types.${source.type}`);
	const calendarLabel = t(`setting.events.vault.calendars.${source.calendar}`);
	const parts = [typeLabel, calendarLabel];
	if (source.isHoliday) {
		parts.push(t("setting.events.custom.holiday"));
	}
	return parts.join(" · ");
}

export function getEventSettings(
	plugin: PersianCalendarPlugin,
	onCustomEventsChange: (events: TCustomEvent[]) => Promise<void>,
	onVaultEventSourcesChange: (sources: TVaultEventSource[]) => Promise<void>,
): SettingDefinitionItem[] {
	const openVaultSourceModal = (existingSource?: TVaultEventSource) => {
		new VaultEventModal(plugin.app, {
			source: existingSource,
			onSave: async (savedSource) => {
				const current = plugin.setting.vaultEventSources ?? [];
				const updated = existingSource
					? current.map((item) => (item.id === savedSource.id ? savedSource : item))
					: [...current, savedSource];
				await onVaultEventSourcesChange(updated);
			},
		}).open();
	};

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
		{
			type: "group",
			heading: t("setting.events.vault.heading"),
			items: [
				{
					name: "",
					searchable: false,
					render: (setting: Setting) => {
						setting.settingEl.empty();
						setting.settingEl.addClass("persian-calendar-custom-events");

						const headerSetting = new Setting(setting.settingEl)
							.setName(t("setting.events.vault.heading"))
							.addButton((btn) => {
								btn
									.setButtonText(t("setting.events.vault.addBtn"))
									.setCta()
									.onClick(() => {
										openVaultSourceModal();
									});
							});
						headerSetting.settingEl.addClass("persian-calendar-custom-events__header");

						const listEl = setting.settingEl.createDiv({
							cls: "persian-calendar-custom-events__list",
						});

						const sources = plugin.setting.vaultEventSources ?? [];
						if (sources.length === 0) {
							listEl.createDiv({
								cls: "persian-calendar-custom-events__empty",
								text: t("setting.events.vault.empty"),
							});
							return;
						}

						for (const source of sources) {
							const itemSetting = new Setting(listEl)
								.setName(formatVaultSourceTitle(source))
								.setDesc(formatVaultSourceMeta(source))
								.addToggle((toggle) => {
									toggle.setValue(source.enabled).onChange(async (value) => {
										const updated = sources.map((item) =>
											item.id === source.id ? { ...item, enabled: value } : item,
										);
										await onVaultEventSourcesChange(updated);
									});
								})
								.addExtraButton((btn) => {
									btn
										.setIcon("pencil")
										.setTooltip(t("setting.events.custom.edit"))
										.onClick(() => {
											openVaultSourceModal(source);
										});
								})
								.addExtraButton((btn) => {
									btn
										.setIcon("trash")
										.setTooltip(t("setting.events.custom.delete"))
										.onClick(async () => {
											const updated = sources.filter((item) => item.id !== source.id);
											await onVaultEventSourcesChange(updated);
										});
								});

							itemSetting.settingEl.addClass("persian-calendar-custom-events__item");
							if (source.isHoliday) {
								itemSetting.settingEl.addClass("persian-calendar-custom-events__item--holiday");
							}
						}
					},
				},
			],
		},
	];
}
