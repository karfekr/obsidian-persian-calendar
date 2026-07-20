import type { SectionRenderer } from "src/types";
import { addDropdown, addHeading, addToggle } from "../controls";

export const renderHolidaySection: SectionRenderer = (ctx, containerEl) => {
	const { controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.holidays");

	addToggle(
		controller,
		containerEl,
		"setting.holidays.showOfficial.name",
		"setting.holidays.showOfficial.desc",
		"showHolidays",
		{ refresh: true },
	);

	addDropdown(
		controller,
		containerEl,
		"setting.holidays.weekendDays.name",
		"setting.holidays.weekendDays.desc",
		"weekendDays",
		{
			friday: "setting.holidays.weekendDays.options.friday",
			"thursday-friday": "setting.holidays.weekendDays.options.thursdayFriday",
			"friday-saturday": "setting.holidays.weekendDays.options.fridaySaturday",
		},
		{ refresh: true },
	);
};
