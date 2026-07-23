import { setLocal } from "src/languages";
import type { SectionRenderer, TLocale } from "src/types";
import { addDropdown, addHeading, addToggle } from "../controls";

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
		"setting.general.placeholderFormat.name",
		"setting.general.placeholderFormat.desc",
		"dateFormat",
		{
			jalali: "setting.general.placeholderFormat.options.jalali",
			gregorian: "setting.general.placeholderFormat.options.gregorian",
		},
		{ refresh: true },
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
