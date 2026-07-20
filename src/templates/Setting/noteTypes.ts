import type { StringKey } from "src/types";

export type NoteTypeDescriptor = {
	id: string;
	pathKey: StringKey;
	pathNameKey: string;
	pathDescKey: string;
	templateKey: StringKey;
	templateNameKey: string;
	templateDescKey: string;
};

export const NOTE_TYPES: NoteTypeDescriptor[] = [
	{
		id: "daily",
		pathKey: "dailyNotesPath",
		pathNameKey: "setting.paths.daily.name",
		pathDescKey: "setting.paths.daily.desc",
		templateKey: "dailyTemplatePath",
		templateNameKey: "setting.templates.daily.name",
		templateDescKey: "setting.templates.daily.desc",
	},
	{
		id: "weekly",
		pathKey: "weeklyNotesPath",
		pathNameKey: "setting.paths.weekly.name",
		pathDescKey: "setting.paths.weekly.desc",
		templateKey: "weeklyTemplatePath",
		templateNameKey: "setting.templates.weekly.name",
		templateDescKey: "setting.templates.weekly.desc",
	},
	{
		id: "monthly",
		pathKey: "monthlyNotesPath",
		pathNameKey: "setting.paths.monthly.name",
		pathDescKey: "setting.paths.monthly.desc",
		templateKey: "monthlyTemplatePath",
		templateNameKey: "setting.templates.monthly.name",
		templateDescKey: "setting.templates.monthly.desc",
	},
	{
		id: "seasonal",
		pathKey: "seasonalNotesPath",
		pathNameKey: "setting.paths.seasonal.name",
		pathDescKey: "setting.paths.seasonal.desc",
		templateKey: "seasonalTemplatePath",
		templateNameKey: "setting.templates.seasonal.name",
		templateDescKey: "setting.templates.seasonal.desc",
	},
	{
		id: "yearly",
		pathKey: "yearlyNotesPath",
		pathNameKey: "setting.paths.yearly.name",
		pathDescKey: "setting.paths.yearly.desc",
		templateKey: "yearlyTemplatePath",
		templateNameKey: "setting.templates.yearly.name",
		templateDescKey: "setting.templates.yearly.desc",
	},
];
