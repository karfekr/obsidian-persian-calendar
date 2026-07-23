import type { TCompiledPattern, TTokenField } from "src/types";
import { tokenize } from "./tokenizer";
import { defaultTokenRegistry } from "./tokens";
import { escapeRegex } from "./utils";

const compiledPatternCache = new Map<string, TCompiledPattern>();

function cacheKey(pattern: string): string {
	return `"en"::${pattern}`;
}

export function compilePattern(pattern: string): TCompiledPattern {
	const key = cacheKey(pattern);
	const cached = compiledPatternCache.get(key);
	if (cached) return cached;

	const segments = tokenize(pattern, defaultTokenRegistry);
	const fields: TTokenField[] = [];
	let regexSource = "";

	for (const segment of segments) {
		if (segment.type === "literal") {
			regexSource += escapeRegex(segment.value);
		} else {
			regexSource += segment.token.regexFragment("en");
			fields.push(segment.token.field);
		}
	}

	const compiled: TCompiledPattern = {
		pattern,
		locale: "en",
		segments,
		regex: new RegExp(`^${regexSource}$`),
		fields,
	};

	compiledPatternCache.set(key, compiled);
	return compiled;
}

export function clearCompiledPatternCache(): void {
	compiledPatternCache.clear();
}

export function getCompiledPatternCacheSize(): number {
	return compiledPatternCache.size;
}
