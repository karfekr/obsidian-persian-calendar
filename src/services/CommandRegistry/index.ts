import { DatePicker, Notice } from "src/components";
import { dailyInTextRegex } from "src/constants";
import { getDirection, onLocalChange, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import {
	addDayDate,
	dateToJalali,
	dateToJWeekNumber,
	jalaliToSeason,
	todayTehran,
} from "src/utils/dateUtils";

export default class CommandRegistry {
	private unregisterCallbacks: (() => void)[] = [];
	private unsubscribeLocale?: () => void;

	constructor(private plugin: PersianCalendarPlugin) {}

	init() {
		this.registerAllCommands();

		// listen language change
		this.unsubscribeLocale = onLocalChange(() => {
			this.reloadCommands();
		});
	}

	destroy() {
		this.unregisterAll();
		this.unsubscribeLocale?.();
	}

	private register(cmd: Parameters<typeof this.plugin.addCommand>[0]) {
		this.plugin.addCommand(cmd);
	}

	private unregisterAll() {
		this.unregisterCallbacks.forEach((fn) => {
			fn();
		});
		this.unregisterCallbacks = [];
	}

	private reloadCommands() {
		this.unregisterAll();
		this.registerAllCommands();
	}

	private registerAllCommands() {
		this.registerReplacePlaceholders();
		this.registerDailyNoteCommands();
		this.registerPeriodicNoteCommands();
		this.registerInsertDatePicker();
		this.registerOpenCalendarCommand();
	}

	private registerOpenCalendarCommand() {
		this.register({
			id: "open-persian-calendar",
			name: t("command.openCalendar"),
			callback: async () => {
				await this.plugin.activateView();
			},
		});
	}

	private registerReplacePlaceholders() {
		this.register({
			id: "replace-persian-placeholders",
			name: t("command.replace"),
			editorCallback: async (_, view) => {
				if (view.file) {
					await this.plugin.placeholder.insertPersianDate(view.file);
					Notice(t("notice.success.placeholder"), getDirection());
				}
			},
		});
	}

	private registerDailyNoteCommands() {
		this.register({
			id: "open-todays-daily-note",
			name: t("command.today"),
			callback: async () => {
				await this.openNoteForDate(todayTehran());
			},
		});

		this.register({
			id: "open-tomorrow-daily-note",
			name: t("command.tomorrow"),
			callback: async () => {
				await this.openNoteForDate(addDayDate(todayTehran(), 1));
			},
		});

		this.register({
			id: "open-yesterday-daily-note",
			name: t("command.yesterday"),
			callback: async () => {
				await this.openNoteForDate(addDayDate(todayTehran(), -1));
			},
		});
	}

	private registerPeriodicNoteCommands() {
		this.register({
			id: "open-this-weeks-note",
			name: t("command.weekly"),
			callback: async () => {
				const now = todayTehran();
				const { jy } = dateToJalali(now);
				const currentWeekNumber = dateToJWeekNumber(now);
				await this.plugin.noteService.openOrCreateWeeklyNote(jy, currentWeekNumber);
			},
		});

		this.register({
			id: "open-current-seasonal-note",
			name: t("command.seasonal"),
			callback: async () => {
				const now = todayTehran();
				const { jy, jm } = dateToJalali(now);
				const season = jalaliToSeason(jm);
				await this.plugin.noteService.openOrCreateSeasonalNote(jy, season);
			},
		});

		this.register({
			id: "open-current-months-note",
			name: t("command.monthly"),
			callback: async () => {
				const { jy, jm } = dateToJalali(todayTehran());
				await this.plugin.noteService.openOrCreateMonthlyNote(jy, jm);
			},
		});

		this.register({
			id: "open-current-years-note",
			name: t("command.yearly"),
			callback: async () => {
				const { jy } = dateToJalali(todayTehran());
				await this.plugin.noteService.openOrCreateYearlyNote(jy);
			},
		});
	}

	private registerInsertDatePicker() {
		this.register({
			id: "insert-date-picker",
			name: t("command.insert"),
			editorCallback: (editor) => {
				const cursor = editor.getCursor();
				const line = editor.getLine(cursor.line);

				const match = line.match(dailyInTextRegex);
				const initial = match?.[0] ?? null;

				new DatePicker(this.plugin.app, this.plugin.setting, initial, (val) => {
					if (match) {
						const start = line.indexOf(match[0]);
						editor.replaceRange(
							val,
							{ line: cursor.line, ch: start },
							{ line: cursor.line, ch: start + match[0].length },
						);
					} else {
						editor.replaceSelection(val);
					}
				}).open();
			},
		});
	}

	private async openNoteForDate(date: Date) {
		const { jy, jm, jd } = dateToJalali(date);
		await this.plugin.noteService.openOrCreateDailyNote(jy, jm, jd);
	}
}
