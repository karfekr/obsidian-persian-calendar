import { Modal, App, setIcon } from "obsidian";
import { SocialLinks } from "src/components";
import type { TReleaseNote, TSetting } from "src/types";

export default class UpdateModal extends Modal {
	private notes: TReleaseNote[];
	private setting: TSetting;
	private onCloseCallback?: () => void;

	constructor(app: App, setting: TSetting, notes: TReleaseNote[], onCloseCallback?: () => void) {
		super(app);
		this.notes = notes;
		this.setting = setting;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("persian-calendar");

		const headerEl = contentEl.createEl("div", { cls: "persian-calendar__update-header" });
		setIcon(headerEl, "calendar-heart");

		headerEl.createEl("p", {
			text: "Persian Calendar",
		});

		SocialLinks(contentEl, this.setting.language);

		this.notes.forEach((note) => {
			const section = contentEl.createEl("div");

			const header = section.createEl("div");
			header.createEl("h3", {
				text: `نسخه ${note.version}`,
				cls: "persian-calendar__update-version",
			});

			if (note.changes && note.changes.length > 0) {
				const changesContainer = section.createEl("div", {
					cls: "persian-calendar__update-body",
				});

				note.changes.forEach((change) => {
					changesContainer.createEl("p", {
						text: change,
						cls: "persian-calendar__update-change",
					});
				});
			}
		});
	}

	onClose() {
		this.contentEl.empty();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}
}
