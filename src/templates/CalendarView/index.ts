import type { App, WorkspaceLeaf } from "obsidian";
import { MarkdownView, View } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import { NoteService } from "src/services";
import type { TJalali, TSetting } from "src/types";
import { dateToJalali, todayTehran } from "src/utils/dateUtils";

import CalendarRenderer from "./CalendarRenderer";
import CalendarNavigation from "./CalendarRenderer/CalendarNavigation";
import CalendarState from "./CalendarState";

export default class CalendarView extends View {
	dailyCheckInterval: number | undefined;
	lastCheckedDate: TJalali = dateToJalali(todayTehran());
	plugin: PersianCalendarPlugin;
	setting: TSetting;
	private calendarNavigation: CalendarNavigation;
	private calendarState: CalendarState;
	private notesService: NoteService;
	private calendarRenderer: CalendarRenderer;

	constructor(leaf: WorkspaceLeaf, app: App, plugin: PersianCalendarPlugin) {
		super(leaf);
		this.app = app;
		this.setting = plugin.setting;
		this.plugin = plugin;
		this.calendarState = new CalendarState();
		this.notesService = new NoteService(this.app, this.plugin);
		this.calendarRenderer = new CalendarRenderer(
			this.containerEl,
			this.calendarState,
			this.notesService,
			this.setting,
		);
		this.calendarNavigation = new CalendarNavigation(
			this.calendarState,
			this.calendarRenderer.render.bind(this.calendarRenderer),
		);
	}

	getViewType() {
		return "persian-calendar";
	}

	getDisplayText() {
		return "Persian Calendar";
	}

	getIcon() {
		return "calendar-heart";
	}

	async onOpen() {
		this.startDailyCheckInterval();

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.handleWorkspaceActivityChange();
			}),
		);

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.handleWorkspaceActivityChange();
			}),
		);

		this.syncActiveDailyNote();

		this.render();
	}

	private handleWorkspaceActivityChange() {
		if (this.app.workspace.getActiveViewOfType(CalendarView) === this) {
			return;
		}

		this.syncActiveDailyNote();
	}

	async onClose() {
		this.stopDailyCheckInterval();
	}

	public render() {
		this.calendarRenderer.render();
	}

	public async goToToday() {
		await this.calendarNavigation.goToToday();
	}

	public refreshCalendar() {
		this.render();
	}

	private syncActiveDailyNote() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const next = view?.file ? this.notesService.getDailyNoteDate(view.file) : null;
		const current = this.calendarState.getActiveJDate();

		if (this.isSameJDate(current, next)) {
			return;
		}

		this.calendarState.setActiveJDate(next);

		if (next) {
			this.calendarState.setJState(next.jy, next.jm);
		}

		this.render();
	}

	private isSameJDate(a: TJalali | null, b: TJalali | null): boolean {
		if (!a || !b) {
			return a === b;
		}

		return a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
	}

	private startDailyCheckInterval() {
		this.stopDailyCheckInterval();
		this.dailyCheckInterval = window.setInterval(() => {
			const today = dateToJalali(todayTehran());
			if (
				today.jy !== this.lastCheckedDate.jy ||
				today.jm !== this.lastCheckedDate.jm ||
				today.jd !== this.lastCheckedDate.jd
			) {
				this.lastCheckedDate = today;
				this.render();
			}
		}, 60 * 1000);
	}

	private stopDailyCheckInterval() {
		if (this.dailyCheckInterval !== undefined) {
			window.clearInterval(this.dailyCheckInterval);
			this.dailyCheckInterval = undefined;
		}
	}
}
