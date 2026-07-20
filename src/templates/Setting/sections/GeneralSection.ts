import { setLocal } from "src/languages";
import type { SectionRenderer, TLocale } from "src/types";
import { addDropdown, addHeading, addToggle, addValidatedText } from "../controls";
import { patternValidator } from "../validation";

export const renderGeneralSection: SectionRenderer = (ctx, containerEl) => {
	const { controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.general");

	addDropdown(
		controller,
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
			onSelect: (value) => setLocal(value as TLocale),
		},
	);

	addDropdown(
		controller,
		containerEl,
		"setting.general.dateFormat.name",
		"setting.general.dateFormat.desc",
		"dateFormat",
		{
			jalali: "setting.general.dateFormat.options.jalali",
			gregorian: "setting.general.dateFormat.options.gregorian",
		},
		{ refresh: true },
	);

	addDropdown(
		controller,
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
		{ refresh: true },
	);

	addValidatedText(
		controller,
		containerEl,
		"setting.paths.daily.formatName",
		"setting.paths.daily.formatDesc",
		"dailyNoteFormat",
		patternValidator,
	);

	addToggle(
		controller,
		containerEl,
		"setting.general.askBeforeCreate.name",
		"setting.general.askBeforeCreate.desc",
		"askForCreateNote",
		{ refresh: true },
	);

	addToggle(
		controller,
		containerEl,
		"setting.general.openDailyOnStartup.name",
		"setting.general.openDailyOnStartup.desc",
		"openDailyNoteOnStartup",
		{ refresh: true },
	);

	addToggle(
		controller,
		containerEl,
		"setting.general.showSeasons.name",
		"setting.general.showSeasons.desc",
		"showSeasonalNotes",
		{ refresh: true },
	);
};
