import { MarkdownView, setIcon } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TOpenNoteMode } from "src/types";
import { todayTehran } from "src/utils/dateUtils";
import type {
	TNoteNavCenterSlot,
	TNoteNavModel,
	TNoteNavSideSlot,
	TNoteNavStripChip,
	TNoteNavTarget,
} from "./model";
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
			case "yearly":
				await this.plugin.noteService.openOrCreateYearlyNote(target.jy, openMode);
				break;
		}
	}

	private bindNavigation(el: HTMLElement, target: TNoteNavTarget, disabled = false): void {
		if (disabled) return;

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
		rootEl.dataset.locale = model.locale;
		rootEl.dataset.mode = model.mode;

		const shell = rootEl.createDiv({ cls: "persian-calendar-note-nav__shell" });

		this.renderTopBar(shell, model);
		this.renderStage(shell, model);
		this.renderSubStrip(shell, model.stripChips);
	}

	private renderTopBar(shell: HTMLElement, model: TNoteNavModel): void {
		const topBar = shell.createDiv({ cls: "persian-calendar-note-nav__top-bar" });

		topBar.createSpan({
			cls: "persian-calendar-note-nav__type-badge",
			text: model.noteTypeLabel,
		});

		const topActions = topBar.createDiv({ cls: "persian-calendar-note-nav__top-actions" });
		const todayBtn = topActions.createEl("button", {
			cls: `persian-calendar-note-nav__today-btn${model.isCurrent ? " is-today" : ""}`,
			type: "button",
			title: model.currentButtonLabel,
		});
		todayBtn.createSpan({ cls: "persian-calendar-note-nav__today-dot" });
		todayBtn.createSpan({ text: model.currentButtonLabel });

		this.bindNavigation(todayBtn, model.todayTarget, model.isCurrent);
	}

	private renderStage(shell: HTMLElement, model: TNoteNavModel): void {
		const stage = shell.createDiv({ cls: "persian-calendar-note-nav__stage" });

		const prevSlot = stage.createEl("button", {
			cls: "persian-calendar-note-nav__slot persian-calendar-note-nav__slot--side persian-calendar-note-nav__area-prev-slot",
			type: "button",
			title: model.prevLabel,
		});
		this.renderSideSlotContent(prevSlot, model.prev);
		this.bindNavigation(prevSlot, model.prev.target);

		const prevBtn = stage.createEl("button", {
			cls: "persian-calendar-note-nav__chevron-btn persian-calendar-note-nav__area-prev-btn",
			type: "button",
			attr: { "aria-label": model.prevLabel },
			title: model.prevLabel,
		});
		setIcon(prevBtn, "chevron-right");
		this.bindNavigation(prevBtn, model.prev.target);

		const centerSlot = stage.createDiv({
			cls: `persian-calendar-note-nav__slot persian-calendar-note-nav__slot--center persian-calendar-note-nav__area-center${
				model.isCurrent ? " is-current" : ""
			}`,
		});
		this.renderCenterSlotContent(centerSlot, model.center);

		const nextBtn = stage.createEl("button", {
			cls: "persian-calendar-note-nav__chevron-btn persian-calendar-note-nav__area-next-btn",
			type: "button",
			attr: { "aria-label": model.nextLabel },
			title: model.nextLabel,
		});
		setIcon(nextBtn, "chevron-left");
		this.bindNavigation(nextBtn, model.next.target);

		const nextSlot = stage.createEl("button", {
			cls: "persian-calendar-note-nav__slot persian-calendar-note-nav__slot--side persian-calendar-note-nav__area-next-slot",
			type: "button",
			title: model.nextLabel,
		});
		this.renderSideSlotContent(nextSlot, model.next);
		this.bindNavigation(nextSlot, model.next.target);
	}

	private renderSideSlotContent(el: HTMLElement, slot: TNoteNavSideSlot): void {
		if (slot.kicker) {
			el.createSpan({ cls: "persian-calendar-note-nav__slot-kicker", text: slot.kicker });
		}

		el.createSpan({ cls: "persian-calendar-note-nav__slot-main", text: slot.main });

		if (slot.sub) {
			el.createSpan({ cls: "persian-calendar-note-nav__slot-sub", text: slot.sub });
		}
	}

	private renderCenterSlotContent(el: HTMLElement, center: TNoteNavCenterSlot): void {
		const kicker = el.createSpan({ cls: "persian-calendar-note-nav__center-kicker" });
		kicker.createSpan({ text: center.kicker });
		if (center.currentPill) {
			kicker.createSpan({
				cls: "persian-calendar-note-nav__current-pill",
				text: center.currentPill,
			});
		}

		const main = el.createDiv({ cls: "persian-calendar-note-nav__center-main" });
		main.createSpan({ cls: "persian-calendar-note-nav__center-title", text: center.main });

		const sub = el.createDiv({ cls: "persian-calendar-note-nav__center-sub" });
		center.subItems.forEach((item, index) => {
			if (index > 0) {
				sub.createSpan({ cls: "persian-calendar-note-nav__sub-sep" });
			}
			sub.createSpan({ text: item });
		});
	}

	private renderSubStrip(shell: HTMLElement, chips: TNoteNavStripChip[]): void {
		if (chips.length === 0) return;

		const strip = shell.createDiv({ cls: "persian-calendar-note-nav__sub-strip" });
		for (const chip of chips) {
			const btn = strip.createEl("button", {
				cls: `persian-calendar-note-nav__strip-chip${chip.active ? " is-active" : ""}`,
				type: "button",
				title: chip.title,
			});
			btn.createSpan({ cls: "persian-calendar-note-nav__strip-chip-label", text: chip.label });
			if (chip.num) {
				btn.createSpan({ cls: "persian-calendar-note-nav__strip-chip-num", text: chip.num });
			}

			this.bindNavigation(btn, chip.target);
		}
	}
}
