import { tokenize } from "./tokenizer";
import { defaultTokenRegistry } from "./tokens";
import type { TCompiledPattern, TLocale, TTokenField } from "./types";
import { escapeRegex } from "./utils";

const compiledPatternCache = new Map<string, TCompiledPattern>();

function cacheKey(pattern: string, locale: TLocale): string {
	return `${locale}::${pattern}`;
}

export function compilePattern(pattern: string, locale: TLocale = "en"): TCompiledPattern {
	const key = cacheKey(pattern, locale);
	const cached = compiledPatternCache.get(key);
	if (cached) return cached;

	const segments = tokenize(pattern, defaultTokenRegistry);
	const fields: TTokenField[] = [];
	let regexSource = "";

	for (const segment of segments) {
		if (segment.type === "literal") {
			regexSource += escapeRegex(segment.value);
		} else {
			regexSource += segment.token.regexFragment(locale);
			fields.push(segment.token.field);
		}
	}

	const compiled: TCompiledPattern = {
		pattern,
		locale,
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
