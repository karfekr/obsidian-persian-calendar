import type { TSetting } from "src/types";
import { defaultTokenRegistry, tokenize } from "src/utils/dateEngine";

const LEGACY_RECOGNIZED_TOKENS = new Set(["jYYYY", "jMMMM", "jMM", "jM", "jQQQQ", "jQQ", "jQ"]);

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

export function applySettingsMigrations(
	rawStoredData: Partial<TSetting> | null,
	merged: TSetting,
): TSetting {
	const result = migrateLegacyPathPatterns(merged);

	if (rawStoredData && rawStoredData.dailyNoteFormat === undefined) {
		result.dailyNoteFormat = result.dateFormat === "jalali" ? "jYYYY-jMM-jDD" : "YYYY-MM-DD";
	}

	return result;
}
