import { MarkdownView, setIcon } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TNoteNavTarget, TOpenNoteMode } from "src/types";
import { todayTehran } from "src/utils/dateUtils";
import type { TNoteNavModel, TNoteNavSideSlot } from "./model";
import { buildNoteNavigationModel } from "./model";

const NAV_ROOT_CLASS = "persian-calendar-note-nav";

export default class NoteNavigation {
	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public refreshAll(): void {
		const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			if (leaf.view instanceof MarkdownView) {
				this.updateView(leaf.view);
			}
		}
	}

	public updateView(view: MarkdownView): void {
		const container = view.containerEl;
		const existing = container.querySelector<HTMLElement>(`:scope > .${NAV_ROOT_CLASS}`);

		if (!this.plugin.setting.showInNoteNavigation || !view.file) {
			existing?.remove();
			return;
		}

		const info = this.plugin.noteService.getPeriodicNoteInfo(view.file);
		if (!info) {
			existing?.remove();
			return;
		}

		const model = buildNoteNavigationModel(
			info,
			this.plugin.setting.weekCalculation,
			todayTehran(),
			this.plugin.setting.language,
		);

		let rootEl = existing;
		if (!rootEl) {
			rootEl = container.createDiv({ cls: `${NAV_ROOT_CLASS} persian-calendar` });
			if (view.contentEl && container.contains(view.contentEl)) {
				container.insertBefore(rootEl, view.contentEl);
			}
		}

		this.render(rootEl, model);
	}

	public destroy(): void {
		const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			if (leaf.view instanceof MarkdownView) {
				leaf.view.containerEl.querySelector(`:scope > .${NAV_ROOT_CLASS}`)?.remove();
			}
		}
	}

	private getOpenModeFromEvent(event: MouseEvent): TOpenNoteMode {
		return event.metaKey || event.ctrlKey || event.button === 1 ? "tab" : "current";
	}

	private async navigateTo(target: TNoteNavTarget, openMode: TOpenNoteMode = "current") {
		switch (target.mode) {
			case "daily":
				await this.plugin.noteService.openOrCreateDailyNote(
					target.jy,
					target.jm,
					target.jd,
					openMode,
				);
				break;
			case "weekly":
				await this.plugin.noteService.openOrCreateWeeklyNote(
					target.weekYear,
					target.weekNumber,
					openMode,
				);
				break;
			case "monthly":
				await this.plugin.noteService.openOrCreateMonthlyNote(target.jy, target.jm, openMode);
				break;
			case "seasonal":
				await this.plugin.noteService.openOrCreateSeasonalNote(
					target.jy,
					target.seasonNumber,
					openMode,
				);
				break;
			case "yearly":
				await this.plugin.noteService.openOrCreateYearlyNote(target.jy, openMode);
				break;
		}
	}

	private bindNavigation(el: HTMLElement, target: TNoteNavTarget): void {
		el.addEventListener("click", (event) => {
			event.preventDefault();
			void this.navigateTo(target, this.getOpenModeFromEvent(event));
		});

		el.addEventListener("auxclick", (event) => {
			if (event.button !== 1) return;
			event.preventDefault();
			void this.navigateTo(target, "tab");
		});
	}

	private render(rootEl: HTMLElement, model: TNoteNavModel): void {
		rootEl.empty();
		rootEl.lang = model.locale;
		rootEl.dataset.locale = model.locale;
		rootEl.dataset.mode = model.mode;

		const shell = rootEl.createDiv({ cls: "persian-calendar-note-nav__shell" });

		this.renderTopBar(shell, model);
		this.renderStage(shell, model);
	}

	private renderTopBar(shell: HTMLElement, model: TNoteNavModel): void {
		const topBar = shell.createDiv({ cls: "persian-calendar-note-nav__top-bar" });

		topBar.createSpan({
			cls: "persian-calendar-note-nav__type-badge",
			text: model.noteTypeLabel,
		});

		topBar.createSpan({ cls: "persian-calendar-note-nav__year", text: model.year });

		const todayBtn = topBar.createEl("button", {
			cls: "persian-calendar-note-nav__today-btn",
			type: "button",
			text: model.currentButtonLabel,
		});

		todayBtn.disabled = model.isCurrent;
		if (!model.isCurrent) this.bindNavigation(todayBtn, model.todayTarget);
	}

	private renderStage(shell: HTMLElement, model: TNoteNavModel): void {
		const stage = shell.createDiv({ cls: "persian-calendar-note-nav__stage" });

		this.renderSideSlot(stage, model.prev, model.prevLabel, "prev");
		if (model.center) {
			const center = stage.createDiv({
				cls: `persian-calendar-note-nav__slot persian-calendar-note-nav__slot--center${model.isCurrent ? " is-current" : ""}`,
			});
			if (model.center.kicker) {
				center.createSpan({
					cls: "persian-calendar-note-nav__center-kicker",
					text: model.center.kicker,
				});
			}
			center.createSpan({
				cls: "persian-calendar-note-nav__center-title",
				text: model.center.main,
			});
		}
		this.renderSideSlot(stage, model.next, model.nextLabel, "next");
	}

	private renderSideSlot(
		stage: HTMLElement,
		slot: TNoteNavSideSlot,
		_directionLabel: string,
		direction: "prev" | "next",
	): void {
		const { target } = slot;
		const exists = this.plugin.noteService.getPeriodicNoteFile(target) !== null;
		const button = stage.createEl("button", {
			cls: `persian-calendar-note-nav__slot persian-calendar-note-nav__slot--side persian-calendar-note-nav__slot--${direction}${exists ? "" : " is-missing"}`,
			type: "button",
		});
		const text = button.createSpan({ cls: "persian-calendar-note-nav__side-text" });
		if (slot.kicker) {
			text.createSpan({ cls: "persian-calendar-note-nav__slot-kicker", text: slot.kicker });
		}
		text.createSpan({ cls: "persian-calendar-note-nav__slot-main", text: slot.main });

		const icon = button.createSpan({
			cls: "persian-calendar-note-nav__side-icons",
			attr: { "aria-hidden": "true" },
		});
		setIcon(icon, direction === "prev" ? "chevron-right" : "chevron-left");
		this.bindNavigation(button, target);
	}
}
