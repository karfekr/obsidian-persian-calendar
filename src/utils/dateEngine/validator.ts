import type { TPatternSegment, TTokenField, TValidationError, TValidationResult } from "src/types";
import { tokenize } from "./tokenizer";
import { defaultTokenRegistry } from "./tokens";

function isNumericTokenSegment(segment: TPatternSegment): boolean {
	if (segment.type !== "token") return false;
	return segment.token.regexFragment("en").startsWith("(\\d");
}

export function validatePattern(pattern: string): TValidationResult {
	const errors: TValidationError[] = [];

	if (!pattern || pattern.trim() === "") {
		errors.push({
			type: "empty-pattern",
			severity: "error",
			message: "Pattern is empty.",
		});
		return { valid: false, errors };
	}

	const segments = tokenize(pattern, defaultTokenRegistry);

	for (const segment of segments) {
		if (segment.type !== "literal" || segment.escaped) continue;

		const unknownRuns = segment.value.match(/[A-Za-z]+/g);
		if (!unknownRuns) continue;

		for (const run of unknownRuns) {
			errors.push({
				type: "unknown-token",
				severity: "error",
				message: `"${run}" is not a recognized token.`,
				token: run,
			});
		}
	}

	for (let i = 0; i < segments.length - 1; i++) {
		const current = segments[i];
		const next = segments[i + 1];

		if (isNumericTokenSegment(current) && isNumericTokenSegment(next)) {
			errors.push({
				type: "ambiguous-adjacent-numeric",
				severity: "warning",
				message: `"${(current as { token: { token: string } }).token.token}" and "${
					(next as { token: { token: string } }).token.token
				}" are adjacent with no literal separator between them; parsing this back may be ambiguous.`,
			});
		}
	}

	const seenFields = new Map<TTokenField, string>();
	for (const segment of segments) {
		if (segment.type !== "token") continue;

		const previousToken = seenFields.get(segment.token.field);
		if (previousToken) {
			errors.push({
				type: "duplicate-field",
				severity: "warning",
				message: `"${previousToken}" and "${segment.token.token}" both target the same value; the later one wins when parsing.`,
			});
		} else {
			seenFields.set(segment.token.field, segment.token.token);
		}
	}

	const valid = !errors.some((error) => error.severity === "error");
	return { valid, errors };
}
