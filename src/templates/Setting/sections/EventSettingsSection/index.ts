import type CalendarSettingTab from "src/templates/Setting";

export function renderEventSettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.events");

	tab.addToggle(containerEl, "setting.events.official.name", null, "showIROfficialEvents");

	tab.addToggle(containerEl, "setting.events.global.name", null, "showGlobalEvents");

	tab.addToggle(containerEl, "setting.events.historical.name", null, "showIRHistoricalEvents");

	tab.addToggle(containerEl, "setting.events.ancient.name", null, "showIRAncientEvents");

	tab.addToggle(containerEl, "setting.events.shia.name", null, "showShiaEvents");

	tab.addToggle(containerEl, "setting.events.sunni.name", null, "showSunniEvents");
}
