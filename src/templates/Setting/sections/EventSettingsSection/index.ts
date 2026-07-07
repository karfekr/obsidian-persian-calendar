import type CalendarSettingTab from "src/templates/Setting";

export function renderEventSettingsSection(
	tab: CalendarSettingTab,
	containerEl: HTMLElement,
): void {
	tab.addHeading(containerEl, "setting.sections.events");

	tab.addToggle(containerEl, "setting.events.official.name", null, "showIROfficialEvents", {
		refresh: true,
	});

	tab.addToggle(containerEl, "setting.events.global.name", null, "showGlobalEvents", {
		refresh: true,
	});

	tab.addToggle(containerEl, "setting.events.historical.name", null, "showIRHistoricalEvents", {
		refresh: true,
	});

	tab.addToggle(containerEl, "setting.events.ancient.name", null, "showIRAncientEvents", {
		refresh: true,
	});

	tab.addToggle(containerEl, "setting.events.shia.name", null, "showShiaEvents", {
		refresh: true,
	});

	tab.addToggle(containerEl, "setting.events.sunni.name", null, "showSunniEvents", {
		refresh: true,
	});
}
