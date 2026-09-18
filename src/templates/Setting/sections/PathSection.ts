import type { SettingDefinitionItem } from "obsidian";
import { t } from "src/languages";
import { NOTE_TYPES } from "../noteTypes";

export function getPathSettings(): SettingDefinitionItem[] {
	return [
		{
			type: "group",
			heading: t("setting.sections.paths"),
			items: NOTE_TYPES.map((noteType) => ({
				name: t(noteType.pathNameKey),
				desc: t(noteType.pathDescKey),
				control: {
					type: "folder" as const,
					key: noteType.pathKey,
					includeRoot: true,
				},
			})),
		},
	];
}
