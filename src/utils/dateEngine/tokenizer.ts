import type { TPatternMode, TPatternSegment } from "src/types";
import type { TokenRegistry } from "./tokens/registry";
import { escapeRegex } from "./utils";

function tokenizeTokensOnly(text: string, registry: TokenRegistry): TPatternSegment[] {
	const tokenAlternation = registry.sortedByLengthDesc().map(escapeRegex).join("|");
	const regex = new RegExp(tokenAlternation, "g");

	const segments: TPatternSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(regex)) {
		const matched = match[0];
		const index = match.index;

		if (index > lastIndex) {
			segments.push({ type: "literal", value: text.slice(lastIndex, index) });
		}

		const token = registry.get(matched);
		if (!token) {
			throw new Error(`Unknown token: ${matched}`);
		}

		segments.push({ type: "token", token });
		lastIndex = index + matched.length;
	}

	if (lastIndex < text.length) {
		segments.push({ type: "literal", value: text.slice(lastIndex) });
	}

	return segments;
}

function tokenizeBracketed(pattern: string, registry: TokenRegistry): TPatternSegment[] {
	const bracketRegex = /\[[^\]]*\]/g;
	const segments: TPatternSegment[] = [];
	let lastIndex = 0;

	for (const match of pattern.matchAll(bracketRegex)) {
		const text = match[0];
		const index = match.index;

		if (index > lastIndex) {
			segments.push({ type: "literal", value: pattern.slice(lastIndex, index), escaped: true });
		}

		const inner = text.slice(1, -1);
		if (inner) {
			segments.push(...tokenizeTokensOnly(inner, registry));
		}

		lastIndex = index + text.length;
	}

	if (lastIndex < pattern.length) {
		segments.push({ type: "literal", value: pattern.slice(lastIndex), escaped: true });
	}

	return segments;
}

export function tokenize(
	pattern: string,
	registry: TokenRegistry,
	mode: TPatternMode = "standard",
): TPatternSegment[] {
	if (mode === "bracketed") {
		return tokenizeBracketed(pattern, registry);
	}

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
