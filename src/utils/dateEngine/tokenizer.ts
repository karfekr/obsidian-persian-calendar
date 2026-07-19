import type { TokenRegistry } from "./tokens/registry";
import type { TPatternSegment } from "./types";

export function tokenize(pattern: string, registry: TokenRegistry): TPatternSegment[] {
	const sortedTokens = registry.sortedByLengthDesc();
	const segments: TPatternSegment[] = [];

	let literalBuffer = "";
	let i = 0;

	const flushLiteral = () => {
		if (literalBuffer) {
			segments.push({ type: "literal", value: literalBuffer });
			literalBuffer = "";
		}
	};

	while (i < pattern.length) {
		const char = pattern[i];

		if (char === "[") {
			const closeIndex = pattern.indexOf("]", i + 1);

			if (closeIndex !== -1) {
				flushLiteral();
				const value = pattern.slice(i + 1, closeIndex);
				if (value) {
					segments.push({ type: "literal", value, escaped: true });
				}
				i = closeIndex + 1;
				continue;
			}

			literalBuffer += char;
			i += 1;
			continue;
		}

		let matchedTokenKey: string | null = null;

		for (const tokenKey of sortedTokens) {
			if (pattern.startsWith(tokenKey, i)) {
				matchedTokenKey = tokenKey;
				break;
			}
		}

		if (matchedTokenKey) {
			flushLiteral();
			const definition = registry.get(matchedTokenKey);
			if (definition) {
				segments.push({ type: "token", token: definition });
			}
			i += matchedTokenKey.length;
			continue;
		}

		literalBuffer += char;
		i += 1;
	}

	flushLiteral();
	return segments;
}
