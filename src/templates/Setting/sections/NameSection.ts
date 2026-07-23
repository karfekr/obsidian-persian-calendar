import type { SectionRenderer } from "src/types";
import { addDropdown, addHeading, addValidatedText } from "../controls";
import { patternValidator } from "../validation";

export const renderNameSection: SectionRenderer = (ctx, containerEl) => {
	const { controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.names");

	addValidatedText(
		controller,
		containerEl,
		"setting.naming.daily.name",
		"setting.naming.daily.desc",
		"dailyNoteFormat",
		patternValidator,
	);

	addDropdown(
		controller,
		containerEl,
		"setting.naming.weekCalculation.name",
		"setting.naming.weekCalculation.desc",
		"weekCalculation",
		{
			"jalali-first-day-of-year": "setting.naming.weekCalculation.options.firstDayOfYear",
			"jalali-first-week-start": "setting.naming.weekCalculation.options.firstWeekStart",
			"gregorian-first-day-of-year":
				"setting.naming.weekCalculation.options.gregorianFirstDayOfYear",
			"gregorian-first-week-start":
				"setting.naming.weekCalculation.options.gregorianFirstWeekStart",
		},
		{ refresh: true },
	);

	addDropdown(
		controller,
		containerEl,
		"setting.naming.monthly.name",
		"setting.naming.monthly.desc",
		"monthlyNoteNaming",
		{
			jalali: "setting.naming.monthly.options.jalali",
			gregorian: "setting.naming.monthly.options.gregorian",
		},
		{ refresh: true },
	);

	addDropdown(
		controller,
		containerEl,
		"setting.naming.yearly.name",
		"setting.naming.yearly.desc",
		"yearlyNoteNaming",
		{
			jalali: "setting.naming.yearly.options.jalali",
			gregorian: "setting.naming.yearly.options.gregorian",
		},
		{ refresh: true },
	);
};
