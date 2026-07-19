import type { TDateEngineContext, TLocale } from "src/types";
import { compilePattern } from "./compiler";
import { DatePatternFormatError } from "./errors";

export function formatPattern(
	pattern: string,
	context: TDateEngineContext,
	locale: TLocale = "en",
): string {
	const compiled = compilePattern(pattern, locale);
	let result = "";

	for (const segment of compiled.segments) {
		if (segment.type === "literal") {
			result += segment.value;
			continue;
		}

		const value = segment.token.format(context, locale);
		if (value === null) {
			throw new DatePatternFormatError(pattern, segment.token.token);
		}

		result += value;
	}

	return result;
}
