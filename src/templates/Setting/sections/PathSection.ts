import type { SettingDefinitionItem } from "obsidian";
import { t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import { NOTE_TYPES } from "../noteTypes";

export function getPathSettings(plugin: PersianCalendarPlugin): SettingDefinitionItem[] {
	const weeklyAnchorSetting = {
		name: "",
		desc: "",
		visible: () => new NotePathBuilder(plugin).weeklyPathNeedsAnchor(),
		control: {
			type: "dropdown" as const,
			key: "weeklyPathAnchor",
			options: {
				start: "ابتدای هفته",
				end: "انتهای هفته",
			},
			defaultValue: "start",
		},
	};

	const weeklyYearBoundaryAnchorSetting = {
		name: "مبنای هفتهٔ مرزی سال",
		desc: "برای هفته‌ای که بین دو سال قرار می‌گیرد، تاریخ مسیر از ابتدای هفته یا انتهای هفته محاسبه می‌شود.",
		visible: () => new NotePathBuilder(plugin).weeklyPathNeedsYearBoundaryAnchor(),
		control: {
			type: "dropdown" as const,
			key: "weeklyPathYearBoundaryAnchor",
			options: {
				start: "ابتدای هفته",
				end: "انتهای هفته",
			},
			defaultValue: "start",
		},
	};

	return [
		{
			type: "group",
			heading: t("setting.sections.paths"),
			items: NOTE_TYPES.flatMap((noteType) => {
				const pathSetting = {
					name: t(noteType.pathNameKey),
					desc: t(noteType.pathDescKey),
					control: {
						type: "folder" as const,
						key: noteType.pathKey,
						includeRoot: true,
					},
				};

				return noteType.id === "weekly"
					? [pathSetting, weeklyAnchorSetting, weeklyYearBoundaryAnchorSetting]
					: [pathSetting];
			}),
		},
	];
}
