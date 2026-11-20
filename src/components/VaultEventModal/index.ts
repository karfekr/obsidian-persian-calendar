import { Modal, PluginSettingTab, Setting } from "obsidian";
import { getDirection, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TVaultEventSource } from "src/types";

function generateVaultSourceId(): string {
	return (
		globalThis.crypto?.randomUUID?.() ??
		`vault-src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
	);
}

export default class VaultEventModal extends Modal {
	constructor(
		private readonly plugin: PersianCalendarPlugin,
		private readonly source: TVaultEventSource | undefined,
		private readonly onSave: (source: TVaultEventSource) => Promise<void>,
	) {
		super(plugin.app);
	}

	onOpen(): void {
		this.modalEl.addClass("persian-calendar");
		this.modalEl.setAttr("dir", getDirection());
		this.setTitle(t(this.source ? "setting.events.vault.edit" : "setting.events.vault.addBtn"));

		const draft: TVaultEventSource = this.source
			? { ...this.source }
			: { id: generateVaultSourceId(), path: "", calendar: "jalali", enabled: true };
		const pickerEl = this.contentEl.createDiv();
		const errorEl = this.contentEl.createDiv({
			cls: "setting-item-description",
			attr: { role: "alert" },
		});

		// shortcut: Render the native file control through a detached tab until modals expose it directly.
		const picker = new (class extends PluginSettingTab {
			getControlValue(): string {
				return draft.path;
			}

			setControlValue(_key: string, path: string): void {
				draft.path = path;
				errorEl.setText("");
			}
		})(this.app, this.plugin);
		picker.containerEl = pickerEl;
		picker.settingItems = [
			{
				name: t("setting.events.vault.notePathLabel"),
				desc: t("setting.events.vault.notePathDesc"),
				control: {
					type: "file",
					key: "path",
					filter: (file) => file.extension === "md",
				},
			},
		];
		picker.display();

		new Setting(this.contentEl)
			.setName(t("setting.events.vault.calendarLabel"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("jalali", t("setting.events.vault.calendars.jalali"))
					.addOption("gregorian", t("setting.events.vault.calendars.gregorian"))
					.addOption("hijri", t("setting.events.vault.calendars.hijri"))
					.setValue(draft.calendar)
					.onChange((calendar) => {
						draft.calendar = calendar as TVaultEventSource["calendar"];
					});
			});

		new Setting(this.contentEl)
			.addButton((button) => {
				button.setButtonText(t("setting.events.vault.cancelBtn")).onClick(() => this.close());
			})
			.addButton((button) => {
				button
					.setButtonText(t("setting.events.vault.saveBtn"))
					.setCta()
					.onClick(async () => {
						if (!draft.path) {
							errorEl.setText(t("setting.events.vault.emptyNotePath"));
							return;
						}

						button.setDisabled(true);
						try {
							await this.onSave({ ...draft });
							this.close();
						} finally {
							button.setDisabled(false);
						}
					});
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
