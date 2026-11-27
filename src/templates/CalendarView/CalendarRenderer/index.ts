import type { NoteService } from "src/services";
import type { TCustomEvent, TSetting } from "src/types";
import type CalendarState from "../CalendarState";
import CalendarBodyRender from "./CalendarBody";
import CalendarHeaderRender from "./CalendarHeader";
import CalendarNavigation from "./CalendarNavigation";
import { safeRender } from "./renderErrorBoundary";

export default class CalendarRenderer {
	private readonly headerRenderer: CalendarHeaderRender;
	private readonly bodyRenderer: CalendarBodyRender;
	private readonly navigation: CalendarNavigation;

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
		private readonly getCustomEvents?: () => TCustomEvent[],
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
			this.getCustomEvents,
		);
	}

	public render() {
		this.containerEl.replaceChildren();
		this.containerEl.classList.add("persian-calendar__sidebar");
		const containerEl = this.containerEl.createDiv({
			cls: "persian-calendar persian-calendar__calendar",
			attr: { dir: this.setting.language === "fa" ? "rtl" : "ltr" },
		});

		safeRender(containerEl, "header", () => {
			this.headerRenderer.render(containerEl);
		});

		if (this.setting.showSeasonalNotes) {
			safeRender(containerEl, "seasonalNotes", () => {
				this.bodyRenderer.renderSeasonalNotesRow(containerEl, this.setting.language);
			});
		}

		safeRender(containerEl, "body", () => {
			const contentDiv = containerEl.createDiv({
				cls: "persian-calendar__content",
			});

			this.bodyRenderer.renderContent(contentDiv, this.setting.language);
		});
	}
}
