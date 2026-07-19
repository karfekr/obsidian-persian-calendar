import type { TDateEngineContext, TLocale } from "src/types";
import { compilePattern } from "./compiler";

export function parsePattern(
	pattern: string,
	input: string,
	locale: TLocale = "en",
): TDateEngineContext | null {
	const compiled = compilePattern(pattern, locale);
	const match = compiled.regex.exec(input);
	if (!match) return null;

	const context: TDateEngineContext = {};
	let groupIndex = 1;

	for (const segment of compiled.segments) {
		if (segment.type !== "token") continue;

		const raw = match[groupIndex];
		groupIndex += 1;

		const value = segment.token.parseValue(raw, locale);
		if (value === null || Number.isNaN(value)) {
			return null;
		}

		context[segment.token.field] = value;
	}

	return context;
}
