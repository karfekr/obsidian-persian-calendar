import type { SettingDefinitionItem } from "obsidian";
import { t } from "src/languages";

export function getGeneralSettings(): SettingDefinitionItem[] {
	return [
		{
			type: "group",
			heading: t("setting.sections.general"),
			items: [
				{
					name: t("setting.general.language.name"),
					control: {
						type: "dropdown",
						key: "language",
						options: {
							fa: t("setting.general.language.options.fa"),
							en: t("setting.general.language.options.en"),
						},
					},
				},
				{
					name: t("setting.general.placeholderFormat.name"),
					desc: t("setting.general.placeholderFormat.desc"),
					control: {
						type: "dropdown",
						key: "dateFormat",
						options: {
							jalali: t("setting.general.placeholderFormat.options.jalali"),
							gregorian: t("setting.general.placeholderFormat.options.gregorian"),
						},
					},
				},
				{
					name: t("setting.general.askBeforeCreate.name"),
					desc: t("setting.general.askBeforeCreate.desc"),
					control: { type: "toggle", key: "askForCreateNote" },
				},
				{
					name: t("setting.general.askBeforeDelete.name"),
					desc: t("setting.general.askBeforeDelete.desc"),
					control: { type: "toggle", key: "askForDeleteNote" },
				},
				{
					name: t("setting.general.openDailyOnStartup.name"),
					desc: t("setting.general.openDailyOnStartup.desc"),
					control: { type: "toggle", key: "openDailyNoteOnStartup" },
				},
				{
					name: t("setting.general.showInNoteNavigation.name"),
					desc: t("setting.general.showInNoteNavigation.desc"),
					control: { type: "toggle", key: "showInNoteNavigation" },
				},
				{
					name: t("setting.general.showSeasons.name"),
					desc: t("setting.general.showSeasons.desc"),
					control: { type: "toggle", key: "showSeasonalNotes" },
				},
			],
		},
		{
			type: "group",
			heading: t("setting.sections.liveExpressions"),
			items: [
				{
					name: t("setting.liveExpressions.outputLanguage.name"),
					desc: t("setting.liveExpressions.outputLanguage.desc"),
					control: {
						type: "dropdown",
						key: "liveExpressionOutputLanguage",
						options: {
							fa: t("setting.liveExpressions.outputLanguage.options.fa"),
							en: t("setting.liveExpressions.outputLanguage.options.en"),
						},
					},
				},
				{
					name: t("setting.liveExpressions.numeralLanguage.name"),
					desc: t("setting.liveExpressions.numeralLanguage.desc"),
					control: {
						type: "dropdown",
						key: "liveExpressionNumeralLanguage",
						options: {
							fa: t("setting.liveExpressions.numeralLanguage.options.fa"),
							en: t("setting.liveExpressions.numeralLanguage.options.en"),
						},
					},
				},
			],
		},
	];
}
