import type { App } from "obsidian";
import { Modal, setIcon } from "obsidian";
import { SocialLinks } from "src/components";
import { RELEASE_NOTES } from "src/constants/releaseNotes";
import type { TReleaseNote, TSetting } from "src/types";

export default class UpdateModal extends Modal {
	private notes: TReleaseNote[];
	private setting: TSetting;
	private onCloseCallback?: () => void;

	constructor(app: App, setting: TSetting, notes?: TReleaseNote[], onCloseCallback?: () => void) {
		super(app);
		this.setting = setting;
		this.notes = notes ?? RELEASE_NOTES;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.replaceChildren();
		contentEl.classList.add("persian-calendar");
		contentEl.setAttribute("dir", this.setting.language === "fa" ? "rtl" : "ltr");

		const headerEl = contentEl.createDiv({
			cls: "persian-calendar__update-header",
		});
		setIcon(headerEl, "calendar-heart");

		const pluginName = "Persian Calendar";
		headerEl.createEl("p", {
			text: pluginName,
		});

		SocialLinks(contentEl);

		this.notes.forEach((note) => {
			const section = contentEl.createDiv();
			const header = section.createDiv();

			const versionText =
				this.setting.language === "fa" ? `نسخه ${note.version}` : `Version ${note.version}`;

			header.createEl("h3", {
				text: versionText,
				cls: "persian-calendar__update-version",
			});

			const changesArray = note.changes[this.setting.language];

			if (changesArray.length > 0) {
				const changesContainer = section.createDiv({
					cls: "persian-calendar__update-body",
				});

				changesArray.forEach((change) => {
					changesContainer.createEl("p", {
						text: change,
						cls: "persian-calendar__update-change",
					});
				});
			}
		});
	}

	onClose() {
		this.contentEl.replaceChildren();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}
}
