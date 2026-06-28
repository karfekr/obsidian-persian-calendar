import type CalendarSettingTab from "src/templates/Setting";

export function renderTemplateSettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.templates");

	tab.addPath(
		containerEl,
		"setting.templates.daily.name",
		"setting.templates.daily.desc",
		"dailyTemplatePath",
		"md-file",
	);

	tab.addPath(
		containerEl,
		"setting.templates.weekly.name",
		"setting.templates.weekly.desc",
		"weeklyTemplatePath",
		"md-file",
	);

	tab.addPath(
		containerEl,
		"setting.templates.monthly.name",
		"setting.templates.monthly.desc",
		"monthlyTemplatePath",
		"md-file",
	);

	tab.addPath(
		containerEl,
		"setting.templates.seasonal.name",
		"setting.templates.seasonal.desc",
		"seasonalTemplatePath",
		"md-file",
	);

	tab.addPath(
		containerEl,
		"setting.templates.yearly.name",
		"setting.templates.yearly.desc",
		"yearlyTemplatePath",
		"md-file",
	);
}
