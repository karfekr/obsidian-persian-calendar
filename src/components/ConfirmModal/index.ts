import { App, Modal } from "obsidian";
import { getDirection, t } from "src/i18n";

class ConfirmModal extends Modal {
	private titleText: string;
	private messageText: string;
	private resolve!: (value: boolean) => void;

	constructor(app: App, titleText: string, messageText: string, resolve: (value: boolean) => void) {
		super(app);
		this.titleText = titleText;
		this.messageText = messageText;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		this.modalEl.addClass("persian-calendar");
		this.modalEl.setAttr("dir", getDirection());

		contentEl.createEl("h2", { text: this.titleText });
		contentEl.createEl("p", { text: this.messageText });

		const buttons = contentEl.createDiv({
			cls: "persian-calendar__cmodal-container",
		});

		const cancelBtn = buttons.createEl("button", {
			text: t("modals.confirmModal.cancelBtn"),
			cls: "persian-calendar__cmodal-cancel",
		});

		const confirmBtn = buttons.createEl("button", {
			text: t("modals.confirmModal.confirmBtn"),
			cls: "persian-calendar__cmodal-confirm",
		});

		confirmBtn.onclick = () => {
			this.resolve(true);
			this.close();
		};

		cancelBtn.onclick = () => {
			this.resolve(false);
			this.close();
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}

export function createNoteModal(
	app: App,
	options?: { title?: string; message?: string },
): Promise<boolean> {
	const title = options?.title ?? t("modals.confirmModal.title");
	const message = options?.message ?? t("modals.confirmModal.message");

	return new Promise((resolve) => {
		new ConfirmModal(app, title, message, resolve).open();
	});
}
