import type CalendarSettingTab from "src/templates/Setting";

export function renderExtraCalendarSettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.extraCalendars");

	tab.addToggle(
		containerEl,
		"setting.extraCalendars.showGregorian.name",
		"setting.extraCalendars.showGregorian.desc",
		"showGeorgianDates",
		{ refresh: true },
	);

	tab.addToggle(
		containerEl,
		"setting.extraCalendars.showHijri.name",
		"setting.extraCalendars.showHijri.desc",
		"showHijriDates",
		{ refresh: true },
	);

	tab.addDropdown(
		containerEl,
		"setting.extraCalendars.hijriBase.name",
		"setting.extraCalendars.hijriBase.desc",
		"hijriBase",
		{
			iran: "setting.extraCalendars.hijriBase.options.iran",
			umalqura: "setting.extraCalendars.hijriBase.options.umalqura",
		},
		{ refresh: true },
	);
}
