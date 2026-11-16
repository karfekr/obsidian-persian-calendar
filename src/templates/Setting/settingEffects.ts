import { setLocal } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TLocale, TSetting } from "src/types";

const REFRESH_DEBOUNCE_MS = 400;

type EffectKind = "refresh-immediate" | "refresh-debounced" | "language";

const SETTING_EFFECTS: Partial<Record<keyof TSetting, EffectKind>> = {
	language: "language",
	dateFormat: "refresh-immediate",
	askForCreateNote: "refresh-immediate",
	askForDeleteNote: "refresh-immediate",
	openDailyNoteOnStartup: "refresh-immediate",
	showSeasonalNotes: "refresh-immediate",

	dailyNotesPath: "refresh-debounced",
	weeklyNotesPath: "refresh-debounced",
	monthlyNotesPath: "refresh-debounced",
	seasonalNotesPath: "refresh-debounced",
	yearlyNotesPath: "refresh-debounced",

	dailyTemplatePath: "refresh-debounced",
	weeklyTemplatePath: "refresh-debounced",
	monthlyTemplatePath: "refresh-debounced",
	seasonalTemplatePath: "refresh-debounced",
	yearlyTemplatePath: "refresh-debounced",

	dailyNoteFormat: "refresh-debounced",
	weekCalculation: "refresh-immediate",
	monthlyNoteNaming: "refresh-immediate",
	yearlyNoteNaming: "refresh-immediate",

	showGeorgianDates: "refresh-immediate",
	showHijriDates: "refresh-immediate",
	hijriBase: "refresh-immediate",

	showHolidays: "refresh-immediate",
	weekendDays: "refresh-immediate",

	showIROfficialEvents: "refresh-immediate",
	showGlobalEvents: "refresh-immediate",
	showIRHistoricalEvents: "refresh-immediate",
	showIRAncientEvents: "refresh-immediate",
	showShiaEvents: "refresh-immediate",
	showSunniEvents: "refresh-immediate",

	liveExpressionsMode: "refresh-immediate",
	liveExpressionsDashboardPath: "refresh-debounced",
	liveExpressionsInterval: "refresh-immediate",
};

export function getNestedValue(obj: unknown, path: string): unknown {
	return path.split(".").reduce((current, key) => {
		if (current === null || typeof current !== "object") {
			return undefined;
		}

		return (current as Record<string, unknown>)[key];
	}, obj);
}

export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
	const keys = path.split(".");
	const lastKey = keys.pop();

	if (!lastKey) return;

	let current = obj;

	for (const key of keys) {
		if (current[key] === null || typeof current[key] !== "object" || Array.isArray(current[key])) {
			current[key] = {};
		}

		current = current[key] as Record<string, unknown>;
	}

	current[lastKey] = value;
}

export function createSettingChangeHandler(
	plugin: PersianCalendarPlugin,
	onLocaleChange: () => void,
): (key: string, value: unknown) => Promise<void> {
	let debounceTimer: number | undefined;

	return async function applySettingChange(key: string, value: unknown): Promise<void> {
		const settingKey = key as keyof TSetting;
		const normalizedValue = settingKey === "liveExpressionsInterval" ? Number(value) : value;

		setNestedValue(plugin.setting, key, normalizedValue);

		if (settingKey === "language") {
			setLocal(normalizedValue as TLocale);
		}

		const isLiveExpressionSetting =
			settingKey === "liveExpressionsMode" ||
			settingKey === "liveExpressionsDashboardPath" ||
			settingKey === "liveExpressionsInterval";

		const effect = SETTING_EFFECTS[settingKey] ?? "refresh-immediate";

		if (effect === "refresh-debounced") {
			if (debounceTimer) {
				window.clearTimeout(debounceTimer);
			}

			debounceTimer = window.setTimeout(() => {
				debounceTimer = undefined;

				void plugin.saveSetting().then(() => {
					plugin.refreshViews();
					if (isLiveExpressionSetting) {
						plugin.liveExpression?.configureTimer();
						plugin.liveExpression?.refreshWorkspaceLeaves();
					}
				});
			}, REFRESH_DEBOUNCE_MS);

			return;
		}

		if (debounceTimer) {
			window.clearTimeout(debounceTimer);
			debounceTimer = undefined;
		}

		await plugin.saveSetting();
		plugin.refreshViews();

		if (isLiveExpressionSetting) {
			plugin.liveExpression?.configureTimer();
			plugin.liveExpression?.refreshWorkspaceLeaves();
		}

		if (effect === "language") {
			onLocaleChange();
		}
	};
}
