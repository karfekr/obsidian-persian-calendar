import type { SettingDefinitionItem } from "obsidian";
import { t } from "src/languages";
import { validatePattern } from "src/utils/dateEngine";

export function getNameSettings(): SettingDefinitionItem[] {
	return [
		{
			type: "group",
			heading: t("setting.sections.names"),
			items: [
				{
					name: t("setting.naming.daily.name"),
					desc: t("setting.naming.daily.desc"),
					control: {
						type: "text",
						key: "dailyNoteFormat",
						validate: (value: string) => {
							const result = validatePattern(value);

							if (result.valid) return;

							return result.errors.map((error) => error.message).join("\n");
						},
					},
				},
				{
					name: t("setting.naming.weekCalculation.name"),
					desc: t("setting.naming.weekCalculation.desc"),
					control: {
						type: "dropdown",
						key: "weekCalculation",
						options: {
							"jalali-first-day-of-year": t(
								"setting.naming.weekCalculation.options.firstDayOfYear",
							),
							"jalali-first-week-start": t("setting.naming.weekCalculation.options.firstWeekStart"),
							"gregorian-first-day-of-year": t(
								"setting.naming.weekCalculation.options.gregorianFirstDayOfYear",
							),
							"gregorian-first-week-start": t(
								"setting.naming.weekCalculation.options.gregorianFirstWeekStart",
							),
						},
					},
				},
				{
					name: t("setting.naming.weeklyPathMonth.name"),
					desc: t("setting.naming.weeklyPathMonth.desc"),
					control: {
						type: "dropdown",
						key: "weeklyPathMonth",
						options: {
							start: t("setting.naming.weeklyPathMonth.options.start"),
							end: t("setting.naming.weeklyPathMonth.options.end"),
						},
					},
				},
				{
					name: t("setting.naming.monthly.name"),
					desc: t("setting.naming.monthly.desc"),
					control: {
						type: "dropdown",
						key: "monthlyNoteNaming",
						options: {
							jalali: t("setting.naming.monthly.options.jalali"),
							gregorian: t("setting.naming.monthly.options.gregorian"),
						},
					},
				},
				{
					name: t("setting.naming.yearly.name"),
					desc: t("setting.naming.yearly.desc"),
					control: {
						type: "dropdown",
						key: "yearlyNoteNaming",
						options: {
							jalali: t("setting.naming.yearly.options.jalali"),
							gregorian: t("setting.naming.yearly.options.gregorian"),
						},
					},
				},
			],
		},
	];
}
