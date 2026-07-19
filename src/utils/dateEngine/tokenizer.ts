import type { TPatternSegment } from "src/types";
import type { TokenRegistry } from "./tokens/registry";
import { escapeRegex } from "./utils";

export function tokenize(pattern: string, registry: TokenRegistry): TPatternSegment[] {
	const tokenAlternation = registry.sortedByLengthDesc().map(escapeRegex).join("|");
	const regex = new RegExp(`\\[[^\\]]*\\]|${tokenAlternation}`, "g");

	const segments: TPatternSegment[] = [];
	let lastIndex = 0;

	for (const match of pattern.matchAll(regex)) {
		const text = match[0];
		const index = match.index;

		if (index > lastIndex) {
			segments.push({ type: "literal", value: pattern.slice(lastIndex, index) });
		}

		if (text.startsWith("[")) {
			const value = text.slice(1, -1);
			if (value) segments.push({ type: "literal", value, escaped: true });
		} else {
			const token = registry.get(text);
			if (!token) {
				throw new Error(`Unknown token: ${text}`);
			}

			segments.push({ type: "token", token });
		}

		lastIndex = index + text.length;
	}

	if (lastIndex < pattern.length) {
		segments.push({ type: "literal", value: pattern.slice(lastIndex) });
	}

	return segments;
}
