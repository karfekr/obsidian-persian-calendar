import type { SettingDefinitionItem } from "obsidian";
import { Setting } from "obsidian";
import VaultEventModal from "src/components/VaultEventModal";
import { t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TVaultEventSource } from "src/types";

export function getEventSettings(
	plugin: PersianCalendarPlugin,
	onVaultEventSourcesChange: (sources: TVaultEventSource[]) => Promise<void>,
): SettingDefinitionItem[] {
	const openRepository = (source?: TVaultEventSource) => {
		new VaultEventModal(plugin, source, async (saved) => {
			const current = plugin.setting.vaultEventSources;
			const updated = current.some((item) => item.id === saved.id)
				? current.map((item) => (item.id === saved.id ? { ...saved, enabled: item.enabled } : item))
				: [...current, saved];
			await onVaultEventSourcesChange(updated);
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
				{
					name: "",
					searchable: false,
					render: (setting) => {
						const { vaultEventSources: sources, showCustomEvents } = plugin.setting;
						const disabled = !showCustomEvents;
						setting.setClass("persian-calendar-event-repositories");
						setting.settingEl.setAttribute("aria-disabled", String(disabled));
						new Setting(setting.controlEl)
							.setDesc(sources.length === 0 ? t("setting.events.vault.empty") : "")
							.addButton((button) => {
								button
									.setButtonText(t("setting.events.vault.addBtn"))
									.setCta()
									.onClick(() => openRepository());
							})
							.setDisabled(disabled);

						for (const source of sources) {
							const file = plugin.app.vault.getFileByPath(source.path);
							const basename =
								file?.basename ?? source.path.split("/").pop()?.replace(/\.md$/i, "") ?? "";
							const repository = new Setting(setting.controlEl)
								.setClass("persian-calendar-event-repository")
								.setDesc(t(`setting.events.vault.calendars.${source.calendar}`))
								.addToggle((toggle) => {
									toggle.setValue(source.enabled).onChange(async (enabled) => {
										const updated = plugin.setting.vaultEventSources.map((item) =>
											item.id === source.id ? { ...item, enabled } : item,
										);
										await onVaultEventSourcesChange(updated);
									});
								})
								.addExtraButton((button) => {
									button
										.setIcon("pencil")
										.setTooltip(t("setting.events.vault.edit"))
										.onClick(() => openRepository(source));
								})
								.addExtraButton((button) => {
									button
										.setIcon("trash")
										.setTooltip(t("setting.events.vault.delete"))
										.onClick(async () => {
											const updated = plugin.setting.vaultEventSources.filter(
												(item) => item.id !== source.id,
											);
											await onVaultEventSourcesChange(updated);
										});
								})
								.setDisabled(disabled);
							repository.nameEl.createEl("bdi", { text: basename, attr: { dir: "auto" } });
						}
					},
				},
			],
		},
	];
}
