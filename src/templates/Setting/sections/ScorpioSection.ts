import type { SettingDefinitionItem } from "obsidian";
import { t } from "src/languages";

export function getScorpioSettings(): SettingDefinitionItem[] {
	return [
		{
			type: "group",
			heading: t("setting.sections.scorpio"),
			items: [
				{
					name: t("setting.scorpio.enable.name"),
					desc: t("setting.scorpio.enable.description"),
					control: { type: "toggle", key: "showMoonInScorpio" },
				},
				{
					name: t("setting.scorpio.method.name"),
					desc: t("setting.scorpio.method.description"),
					control: {
						type: "dropdown",
						key: "scorpioCalculationMethod",
						options: {
							both: t("setting.scorpio.method.options.both"),
							constellation: t("setting.scorpio.method.options.constellation"),
							sign: t("setting.scorpio.method.options.sign"),
						},
					},
				},
				{
					name: t("setting.scorpio.info.title"),
					desc: t("setting.scorpio.info.description"),
				},
			],
		},
	];
}
