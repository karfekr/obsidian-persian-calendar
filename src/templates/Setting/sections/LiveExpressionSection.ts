import type { SettingDefinitionItem, TFile } from "obsidian";
import { t } from "src/languages";

export function getLiveExpressionSettings(): SettingDefinitionItem[] {
	return [
		{
			type: "group",
			heading: t("setting.sections.liveExpressions"),
			items: [
				{
					name: t("setting.liveExpressions.mode.name"),
					desc: t("setting.liveExpressions.mode.desc"),
					control: {
						type: "dropdown",
						key: "liveExpressionsMode",
						options: {
							disabled: t("setting.liveExpressions.mode.options.disabled"),
							dashboard: t("setting.liveExpressions.mode.options.dashboard"),
							all: t("setting.liveExpressions.mode.options.all"),
						},
					},
				},
				{
					name: t("setting.liveExpressions.dashboardPath.name"),
					desc: t("setting.liveExpressions.dashboardPath.desc"),
					control: {
						type: "file",
						key: "liveExpressionsDashboardPath",
						filter: (file: TFile) => file.extension === "md",
					},
				},
				{
					name: t("setting.liveExpressions.interval.name"),
					desc: t("setting.liveExpressions.interval.desc"),
					control: {
						type: "dropdown",
						key: "liveExpressionsInterval",
						options: {
							"1000": t("setting.liveExpressions.interval.options.1000"),
							"5000": t("setting.liveExpressions.interval.options.5000"),
							"30000": t("setting.liveExpressions.interval.options.30000"),
							"60000": t("setting.liveExpressions.interval.options.60000"),
						},
					},
				},
			],
		},
	];
}
