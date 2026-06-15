import { NoteService } from "src/services";
import type { TSetting } from "src/types";

import CalendarState from "../CalendarState";
import CalendarBodyRender from "./CalendarBody";
import CalendarHeaderRender from "./CalendarHeader";
import CalendarNavigation from "./CalendarNavigation";

export default class CalendarRenderer {
	private readonly headerRenderer: CalendarHeaderRender;
	private readonly bodyRenderer: CalendarBodyRender;
	private readonly navigation: CalendarNavigation;

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
	) {
		this.navigation = new CalendarNavigation(this.calendarState, () => {
			this.render();
		});

		this.headerRenderer = new CalendarHeaderRender(
			this.calendarState,
			this.notesService,
			this.setting,
			this.navigation,
		);

		this.bodyRenderer = new CalendarBodyRender(
			this.calendarState,
			this.notesService,
			this.setting,
			() => {
				this.render();
			},
			this.navigation,
		);
	}

	public render() {
		const containerEl = this.containerEl;
		containerEl.empty();

		containerEl.addClass("persian-calendar", "persian-calendar__calendar");
		containerEl.setAttr("dir", "rtl");

		this.headerRenderer.render(containerEl);

		if (this.setting.showSeasonalNotes) {
			this.bodyRenderer.renderSeasonalNotesRow(containerEl, this.setting.language);
		}

		const contentDiv = containerEl.createEl("div", { cls: "persian-calendar__content" });
		this.bodyRenderer.renderContent(contentDiv, this.setting.language);
	}
}
