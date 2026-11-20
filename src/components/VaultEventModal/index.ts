import type { App } from "obsidian";
import { Modal, Setting } from "obsidian";
import { getDirection, t } from "src/languages";
import type { TVaultEventCalendar, TVaultEventSource, TVaultEventSourceType } from "src/types";

type TVaultEventModalOptions = {
	source?: TVaultEventSource;
	onSave: (source: TVaultEventSource) => Promise<void> | void;
};

function generateVaultSourceId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `vault-src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default class VaultEventModal extends Modal {
	private sourceType: TVaultEventSourceType;
	private pathValue: string;
	private propertyValue: string;
	private titleTemplateValue: string;
	private calendarValue: TVaultEventCalendar;
	private isHolidayValue: boolean;

	private errorEl: HTMLElement | null = null;
	private readonly isEditMode: boolean;

	constructor(
		app: App,
		private readonly options: TVaultEventModalOptions,
	) {
		super(app);

		const existing = options.source;
		this.isEditMode = Boolean(existing);
		this.sourceType = existing?.type ?? "frontmatter";
		this.pathValue = existing?.path ?? "";
		this.propertyValue = existing?.property ?? "birthday";
		this.titleTemplateValue = existing?.titleTemplate ?? "";
		this.calendarValue = existing?.calendar ?? "auto";
		this.isHolidayValue = existing?.isHoliday ?? false;
	}

	onOpen() {
		this.modalEl.addClass("persian-calendar");
		this.modalEl.setAttr("dir", getDirection());

		this.titleEl.setText(
			this.isEditMode ? t("modal.vaultEvent.editTitle") : t("modal.vaultEvent.addTitle"),
		);

		this.renderForm();
	}

	private renderForm() {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName(t("modal.vaultEvent.typeLabel")).addDropdown((dropdown) => {
			dropdown
				.addOption("frontmatter", t("modal.vaultEvent.typeFrontmatter"))
				.addOption("note", t("modal.vaultEvent.typeNote"))
				.setValue(this.sourceType)
				.onChange((value) => {
					this.sourceType = value as TVaultEventSourceType;
					this.renderForm();
				});
		});

		const isFrontmatter = this.sourceType === "frontmatter";

		new Setting(contentEl)
			.setName(
				isFrontmatter ? t("modal.vaultEvent.folderPathLabel") : t("modal.vaultEvent.notePathLabel"),
			)
			.setDesc(
				isFrontmatter ? t("modal.vaultEvent.folderPathDesc") : t("modal.vaultEvent.notePathDesc"),
			)
			.addText((text) => {
				text
					.setPlaceholder(
						isFrontmatter
							? t("modal.vaultEvent.folderPathPlaceholder")
							: t("modal.vaultEvent.notePathPlaceholder"),
					)
					.setValue(this.pathValue)
					.onChange((value) => {
						this.pathValue = value;
						this.clearError();
					});
			});

		if (isFrontmatter) {
			new Setting(contentEl).setName(t("modal.vaultEvent.propertyLabel")).addText((text) => {
				text
					.setPlaceholder(t("modal.vaultEvent.propertyPlaceholder"))
					.setValue(this.propertyValue)
					.onChange((value) => {
						this.propertyValue = value;
						this.clearError();
					});
			});

			new Setting(contentEl)
				.setName(t("modal.vaultEvent.titleTemplateLabel"))
				.setDesc(t("modal.vaultEvent.titleTemplateDesc"))
				.addText((text) => {
					text
						.setPlaceholder(t("modal.vaultEvent.titleTemplatePlaceholder"))
						.setValue(this.titleTemplateValue)
						.onChange((value) => {
							this.titleTemplateValue = value;
						});
				});
		}

		new Setting(contentEl).setName(t("modal.vaultEvent.calendarLabel")).addDropdown((dropdown) => {
			dropdown
				.addOption("auto", t("setting.events.vault.calendars.auto"))
				.addOption("jalali", t("setting.events.vault.calendars.jalali"))
				.addOption("gregorian", t("setting.events.vault.calendars.gregorian"))
				.addOption("hijri", t("setting.events.vault.calendars.hijri"))
				.setValue(this.calendarValue)
				.onChange((value) => {
					this.calendarValue = value as TVaultEventCalendar;
				});
		});

		new Setting(contentEl).setName(t("modal.vaultEvent.holidayLabel")).addToggle((toggle) => {
			toggle.setValue(this.isHolidayValue).onChange((value) => {
				this.isHolidayValue = value;
			});
		});

		this.errorEl = contentEl.createDiv({
			cls: "persian-calendar__custom-event-error",
		});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(t("modal.vaultEvent.cancelBtn")).onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn
					.setButtonText(t("modal.vaultEvent.saveBtn"))
					.setCta()
					.onClick(() => {
						void this.handleSave();
					});
			});
	}

	private clearError() {
		if (this.errorEl) {
			this.errorEl.setText("");
		}
	}

	private showError(message: string) {
		if (this.errorEl) {
			this.errorEl.setText(message);
		}
	}

	private async handleSave() {
		const trimmedPath = this.pathValue.trim();
		const trimmedProperty = this.propertyValue.trim();

		if (this.sourceType === "frontmatter" && !trimmedProperty) {
			this.showError(t("modal.vaultEvent.errors.emptyProperty"));
			return;
		}

		if (this.sourceType === "note" && !trimmedPath) {
			this.showError(t("modal.vaultEvent.errors.emptyNotePath"));
			return;
		}

		const savedSource: TVaultEventSource = {
			id: this.options.source?.id ?? generateVaultSourceId(),
			type: this.sourceType,
			path: trimmedPath,
			...(this.sourceType === "frontmatter"
				? {
						property: trimmedProperty,
						titleTemplate: this.titleTemplateValue.trim() || undefined,
					}
				: {}),
			calendar: this.calendarValue,
			isHoliday: this.isHolidayValue,
			enabled: this.options.source?.enabled ?? true,
		};

		await this.options.onSave(savedSource);
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
