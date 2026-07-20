import type CalendarSettingTab from "src/templates/Setting";

export function renderGeneralSettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.general");

	tab.addDropdown(
		containerEl,
		"setting.general.language.name",
		null,
		"language",
		{
			fa: "setting.general.language.options.fa",
			en: "setting.general.language.options.en",
		},
		{
			refresh: true,
			isLanguage: true,
		},
	);

	tab.addDropdown(
		containerEl,
		"setting.general.dateFormat.name",
		"setting.general.dateFormat.desc",
		"dateFormat",
		{
			jalali: "setting.general.dateFormat.options.jalali",
			gregorian: "setting.general.dateFormat.options.gregorian",
		},
		{
			refresh: true,
		},
	);

	tab.addDropdown(
		containerEl,
		"setting.general.weekCalculationMode.name",
		"setting.general.weekCalculationMode.desc",
		"weekCalculationMode",
		{
			"jalali-first-day-of-year": "setting.general.weekCalculationMode.options.firstDayOfYear",
			"jalali-first-week-start": "setting.general.weekCalculationMode.options.firstWeekStart",
			"gregorian-first-day-of-year":
				"setting.general.weekCalculationMode.options.gregorianFirstDayOfYear",
			"gregorian-first-week-start":
				"setting.general.weekCalculationMode.options.gregorianFirstWeekStart",
		},
		{
			refresh: true,
		},
	);

	tab.addPatternField(
		containerEl,
		"setting.paths.daily.formatName",
		"setting.paths.daily.formatDesc",
		"dailyNoteFormat",
	);

	tab.addToggle(
		containerEl,
		"setting.general.askBeforeCreate.name",
		"setting.general.askBeforeCreate.desc",
		"askForCreateNote",
		{
			refresh: true,
		},
	);

	tab.addToggle(
		containerEl,
		"setting.general.openDailyOnStartup.name",
		"setting.general.openDailyOnStartup.desc",
		"openDailyNoteOnStartup",
		{
			refresh: true,
		},
	);

	tab.addToggle(
		containerEl,
		"setting.general.showSeasons.name",
		"setting.general.showSeasons.desc",
		"showSeasonalNotes",
		{
			refresh: true,
		},
	);
}
