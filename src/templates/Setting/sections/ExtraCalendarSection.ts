import type { SectionRenderer } from "src/types";
import { addDropdown, addHeading, addToggle } from "../controls";

export const renderExtraCalendarSection: SectionRenderer = (ctx, containerEl) => {
	const { controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.extraCalendars");

	addToggle(
		controller,
		containerEl,
		"setting.extraCalendars.showGregorian.name",
		"setting.extraCalendars.showGregorian.desc",
		"showGeorgianDates",
		{ refresh: true },
	);

	addToggle(
		controller,
		containerEl,
		"setting.extraCalendars.showHijri.name",
		"setting.extraCalendars.showHijri.desc",
		"showHijriDates",
		{ refresh: true },
	);

	addDropdown(
		controller,
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
};
