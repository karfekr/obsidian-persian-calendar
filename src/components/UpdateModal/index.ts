import { Modal, App, setIcon } from "obsidian";
import { SocialLinks } from "src/components";
import type { TReleaseNote, TSetting } from "src/types";
import { RELEASE_NOTES } from "src/constants/releaseNotes";

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
		contentEl.empty();
		contentEl.addClass("persian-calendar");
		contentEl.setAttr("dir", this.setting.language === "fa" ? "rtl" : "ltr");

		const headerEl = contentEl.createEl("div", { cls: "persian-calendar__update-header" });
		setIcon(headerEl, "calendar-heart");

		const pluginName = "Persian Calendar";
		headerEl.createEl("p", { text: pluginName });

		SocialLinks(contentEl, this.setting.language);

		this.notes.forEach((note) => {
			const section = contentEl.createEl("div");
			const header = section.createEl("div");
			const versionText =
				this.setting.language === "fa" ? `نسخه ${note.version}` : `Version ${note.version}`;
			header.createEl("h3", {
				text: versionText,
				cls: "persian-calendar__update-version",
			});

			const changesArray = note.changes[this.setting.language];
			if (changesArray && changesArray.length > 0) {
				const changesContainer = section.createEl("div", {
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
		this.contentEl.empty();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}
}
