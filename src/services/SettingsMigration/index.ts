import { DEFAULT_SETTING } from "src/constants/setting";
import type { TSetting, TWeekDays } from "src/types";
import { defaultTokenRegistry, tokenize } from "src/utils/dateEngine";

const LEGACY_RECOGNIZED_TOKENS = new Set([
	"jYYYY",
	"jYY",
	"jQQQQ",
	"jQQ",
	"jQ",
	"jMMMM",
	"jMMM",
	"jMM",
	"jM",
	"jDD",
	"jD",
]);

const LEGACY_PATH_KEYS = [
	"dailyNotesPath",
	"weeklyNotesPath",
	"monthlyNotesPath",
	"seasonalNotesPath",
	"yearlyNotesPath",
] as const satisfies readonly (keyof TSetting)[];

export function migrateLegacyPathPattern(pattern: string): string {
	const segments = tokenize(pattern, defaultTokenRegistry);

	return segments
		.map((segment) => {
			if (segment.type === "literal") {
				return segment.escaped ? `[${segment.value}]` : segment.value;
			}

			return LEGACY_RECOGNIZED_TOKENS.has(segment.token.token)
				? segment.token.token
				: `[${segment.token.token}]`;
		})
		.join("");
}

export function migrateLegacyPathPatterns(setting: TSetting): TSetting {
	const migrated = { ...setting };

	for (const key of LEGACY_PATH_KEYS) {
		migrated[key] = migrateLegacyPathPattern(migrated[key]);
	}

	return migrated;
}

type LegacyWeekendDays = "thursday-friday" | "friday" | "friday-saturday";

export type RawStoredSettings = Omit<Partial<TSetting>, "weekendDays"> & {
	weekendDays?: TWeekDays | LegacyWeekendDays;
};

function migrateWeekendDays(rawStoredData: RawStoredSettings, merged: TSetting): TSetting {
	const legacyWeekendDays = rawStoredData.weekendDays;

	if (
		typeof legacyWeekendDays !== "string" ||
		!["thursday-friday", "friday", "friday-saturday"].includes(legacyWeekendDays)
	) {
		return merged;
	}

	const weekendDays: TWeekDays = {
		saturday: false,
		sunday: false,
		monday: false,
		tuesday: false,
		wednesday: false,
		thursday: false,
		friday: false,
	};

	switch (legacyWeekendDays) {
		case "thursday-friday":
			weekendDays.thursday = true;
			weekendDays.friday = true;
			break;

		case "friday":
			weekendDays.friday = true;
			break;

		case "friday-saturday":
			weekendDays.friday = true;
			weekendDays.saturday = true;
			break;
	}

	return {
		...merged,
		weekendDays,
	};
}

export function applySettingsMigrations(rawStoredData: RawStoredSettings | null): TSetting {
	const { weekendDays, ...stored } = rawStoredData ?? {};
	let result = {
		...DEFAULT_SETTING,
		...stored,
		...(typeof weekendDays === "object" ? { weekendDays } : {}),
	};

	if (rawStoredData?.legacyPathPatternsMigrated !== true) {
		result = migrateLegacyPathPatterns(result);
		result.legacyPathPatternsMigrated = true;
	}

	if (rawStoredData && rawStoredData.dailyNoteFormat === undefined) {
		result.dailyNoteFormat = result.dateFormat === "jalali" ? "jYYYY-jMM-jDD" : "YYYY-MM-DD";
	}

	result = migrateWeekendDays(rawStoredData ?? {}, result);

	return result;
}
