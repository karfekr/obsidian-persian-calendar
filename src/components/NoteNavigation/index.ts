import { MarkdownView, setIcon } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TNoteNavMode, TOpenNoteMode } from "src/types";
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

const MODE_TABS: readonly { mode: TNoteNavMode; en: string; fa: string }[] = [
	{ mode: "daily", en: "Daily", fa: "روزانه" },
	{ mode: "weekly", en: "Weekly", fa: "هفتگی" },
	{ mode: "monthly", en: "Monthly", fa: "ماهانه" },
	{ mode: "yearly", en: "Yearly", fa: "سالانه" },
];

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

		const shell = rootEl.createDiv({ cls: "persian-calendar-note-nav__shell" });

		this.renderTopBar(shell, model);
		this.renderStage(shell, model);
		this.renderSubStrip(shell, model.stripChips);
	}

	private renderTopBar(shell: HTMLElement, model: TNoteNavModel): void {
		const topBar = shell.createDiv({ cls: "persian-calendar-note-nav__top-bar" });

		const modeTabs = topBar.createDiv({
			cls: "persian-calendar-note-nav__mode-tabs",
			attr: { role: "tablist", "aria-label": "Calendar granularity" },
		});

		for (const tab of MODE_TABS) {
			const isActive = tab.mode === model.mode;
			const tabBtn = modeTabs.createEl("button", {
				cls: `persian-calendar-note-nav__mode-tab${isActive ? " is-active" : ""}`,
				type: "button",
				attr: {
					role: "tab",
					"aria-selected": String(isActive),
					"data-mode": tab.mode,
				},
			});
			tabBtn.createSpan({ text: tab.en });
			tabBtn.createSpan({ cls: "persian-calendar-note-nav__fa-label", text: tab.fa });

			this.bindNavigation(tabBtn, model.modeTargets[tab.mode], isActive);
		}

		const topActions = topBar.createDiv({ cls: "persian-calendar-note-nav__top-actions" });
		const todayBtn = topActions.createEl("button", {
			cls: `persian-calendar-note-nav__today-btn${model.isCurrent ? " is-today" : ""}`,
			type: "button",
			title: "Jump to Today (امروز)",
		});
		todayBtn.createSpan({ cls: "persian-calendar-note-nav__today-dot" });
		todayBtn.createSpan({ text: "Today" });
		todayBtn.createSpan({
			cls: "persian-calendar-note-nav__fa-text persian-calendar-note-nav__today-fa",
			text: "امروز",
		});

		this.bindNavigation(todayBtn, model.todayTarget, model.isCurrent);
	}

	private renderStage(shell: HTMLElement, model: TNoteNavModel): void {
		const stage = shell.createDiv({ cls: "persian-calendar-note-nav__stage" });

		const prevSlot = stage.createEl("button", {
			cls: "persian-calendar-note-nav__slot persian-calendar-note-nav__slot--side",
			type: "button",
			title: "Previous",
		});
		this.renderSideSlotContent(prevSlot, model.prev);
		this.bindNavigation(prevSlot, model.prev.target);

		const prevBtn = stage.createEl("button", {
			cls: "persian-calendar-note-nav__chevron-btn",
			type: "button",
			attr: { "aria-label": "Previous" },
		});
		setIcon(prevBtn, "chevron-left");
		this.bindNavigation(prevBtn, model.prev.target);

		const centerSlot = stage.createDiv({
			cls: `persian-calendar-note-nav__slot persian-calendar-note-nav__slot--center${
				model.isCurrent ? " is-current" : ""
			}`,
		});
		this.renderCenterSlotContent(centerSlot, model.center);

		const nextBtn = stage.createEl("button", {
			cls: "persian-calendar-note-nav__chevron-btn",
			type: "button",
			attr: { "aria-label": "Next" },
		});
		setIcon(nextBtn, "chevron-right");
		this.bindNavigation(nextBtn, model.next.target);

		const nextSlot = stage.createEl("button", {
			cls: "persian-calendar-note-nav__slot persian-calendar-note-nav__slot--side",
			type: "button",
			title: "Next",
		});
		this.renderSideSlotContent(nextSlot, model.next);
		this.bindNavigation(nextSlot, model.next.target);
	}

	private renderSideSlotContent(el: HTMLElement, slot: TNoteNavSideSlot): void {
		if (slot.kickerEn || slot.kickerFa) {
			const kicker = el.createSpan({ cls: "persian-calendar-note-nav__slot-kicker" });
			if (slot.kickerEn) kicker.appendText(slot.kickerEn);
			if (slot.kickerEn && slot.kickerFa) kicker.appendText(" · ");
			if (slot.kickerFa) {
				kicker.createSpan({ cls: "persian-calendar-note-nav__fa-text", text: slot.kickerFa });
			}
		}

		const main = el.createSpan({
			cls: `persian-calendar-note-nav__slot-main${
				slot.mainIsFaPrimary
					? " persian-calendar-note-nav__fa-text persian-calendar-note-nav__slot-main--fa-primary"
					: ""
			}`,
		});
		if (slot.mainIsFaPrimary) {
			if (slot.mainFa) main.appendText(slot.mainFa);
		} else {
			if (slot.mainEn) main.appendText(slot.mainEn);
			if (slot.mainEn && slot.mainFa) main.appendText(" ");
			if (slot.mainFa) {
				main.createSpan({
					cls: "persian-calendar-note-nav__fa-text persian-calendar-note-nav__slot-main-fa",
					text: slot.mainFa,
				});
			}
		}

		if (slot.subEn || slot.subFa) {
			const sub = el.createSpan({
				cls: `persian-calendar-note-nav__slot-sub${
					!slot.subEn && slot.subFa ? " persian-calendar-note-nav__fa-text" : ""
				}`,
			});
			if (slot.subEn) sub.appendText(slot.subEn);
			if (slot.subEn && slot.subFa) sub.appendText(" · ");
			if (slot.subFa) {
				if (slot.subEn) {
					sub.createSpan({ cls: "persian-calendar-note-nav__fa-text", text: slot.subFa });
				} else {
					sub.appendText(slot.subFa);
				}
			}
		}
	}

	private renderCenterSlotContent(el: HTMLElement, center: TNoteNavCenterSlot): void {
		const kicker = el.createSpan({ cls: "persian-calendar-note-nav__center-kicker" });
		kicker.createSpan({ text: center.kickerEn });
		if (center.kickerFa) {
			kicker.createSpan({ cls: "persian-calendar-note-nav__fa-text", text: center.kickerFa });
		}
		if (center.currentPillEn && center.currentPillFa) {
			const pill = kicker.createSpan({ cls: "persian-calendar-note-nav__current-pill" });
			pill.appendText(`${center.currentPillEn} · `);
			pill.createSpan({ cls: "persian-calendar-note-nav__fa-text", text: center.currentPillFa });
		}

		const main = el.createDiv({ cls: "persian-calendar-note-nav__center-main" });
		const renderNum = () => {
			if (!center.mainNum) return;
			main.createSpan({
				cls: `persian-calendar-note-nav__center-num${
					center.mainNumIsSecondary ? " persian-calendar-note-nav__center-num--secondary" : ""
				}`,
				text: center.mainNum,
			});
		};
		const renderFa = () => {
			if (!center.mainFa) return;
			const sizeClass =
				center.mainFaSize === "week"
					? " persian-calendar-note-nav__center-fa--week"
					: center.mainFaSize === "month"
						? " persian-calendar-note-nav__center-fa--month"
						: "";
			main.createSpan({
				cls: `persian-calendar-note-nav__center-fa${sizeClass}`,
				text: center.mainFa,
			});
		};

		if (center.mainOrder === "fa-first") {
			renderFa();
			renderNum();
		} else {
			renderNum();
			renderFa();
		}

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
				title: chip.title ?? "",
			});
			if (chip.en) {
				btn.createSpan({ text: chip.en });
			}
			if (chip.fa) {
				btn.createSpan({ cls: "persian-calendar-note-nav__strip-chip-fa", text: chip.fa });
			}
			if (chip.num) {
				btn.createSpan({ cls: "persian-calendar-note-nav__strip-chip-num", text: chip.num });
			}

			this.bindNavigation(btn, chip.target);
		}
	}
}
