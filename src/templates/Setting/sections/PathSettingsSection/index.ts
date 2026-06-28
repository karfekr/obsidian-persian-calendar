import type CalendarSettingTab from "src/templates/Setting";

export function renderPathSettingsSection(tab: CalendarSettingTab, containerEl: HTMLElement): void {
	tab.addHeading(containerEl, "setting.sections.paths");

	tab.addPath(
		containerEl,
		"setting.paths.daily.name",
		"setting.paths.daily.desc",
		"dailyNotesPath",
		"folder",
	);

	tab.addPath(
		containerEl,
		"setting.paths.weekly.name",
		"setting.paths.weekly.desc",
		"weeklyNotesPath",
		"folder",
	);

	tab.addPath(
		containerEl,
		"setting.paths.monthly.name",
		"setting.paths.monthly.desc",
		"monthlyNotesPath",
		"folder",
	);

	tab.addPath(
		containerEl,
		"setting.paths.seasonal.name",
		"setting.paths.seasonal.desc",
		"seasonalNotesPath",
		"folder",
	);

	tab.addPath(
		containerEl,
		"setting.paths.yearly.name",
		"setting.paths.yearly.desc",
		"yearlyNotesPath",
		"folder",
	);
}
