import type CalendarSettingTab from "src/templates/Setting";

export function renderHolidaySettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.holidays");

	tab.addToggle(
		containerEl,
		"setting.holidays.showOfficial.name",
		"setting.holidays.showOfficial.desc",
		"showHolidays",
		{
			refresh: true,
		},
	);

	tab.addDropdown(
		containerEl,
		"setting.holidays.weekendDays.name",
		"setting.holidays.weekendDays.desc",
		"weekendDays",
		{
			friday: "setting.holidays.weekendDays.options.friday",
			"thursday-friday": "setting.holidays.weekendDays.options.thursdayFriday",
			"friday-saturday": "setting.holidays.weekendDays.options.fridaySaturday",
		},
		{
			refresh: true,
		},
	);
}
