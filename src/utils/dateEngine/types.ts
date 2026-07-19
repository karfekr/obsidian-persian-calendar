import type { TLocal } from "src/types";

export type TLocale = TLocal;

export type TCalendarFamily = "gregorian" | "jalali";

export type TDateEngineContext = {
	gy?: number;
	gm?: number;
	gd?: number;
	jy?: number;
	jm?: number;
	jd?: number;
	week?: number;
	season?: number;
};

export type TTokenField = keyof TDateEngineContext;

export interface TTokenDefinition {
	token: string;
	family: TCalendarFamily;
	field: TTokenField;
	format: (ctx: TDateEngineContext, locale: TLocale) => string | null;
	regexFragment: (locale: TLocale) => string;
	parseValue: (raw: string, locale: TLocale) => number | null;
}

export type TPatternSegment =
	| { type: "literal"; value: string; escaped?: boolean }
	| { type: "token"; token: TTokenDefinition };

export interface TCompiledPattern {
	pattern: string;
	locale: TLocale;
	segments: TPatternSegment[];
	regex: RegExp;
	fields: TTokenField[];
}

export type TValidationSeverity = "error" | "warning";

export type TValidationError = {
	type: "empty-pattern" | "unknown-token" | "ambiguous-adjacent-numeric" | "duplicate-field";
	severity: TValidationSeverity;
	message: string;
	token?: string;
};

export type TValidationResult = {
	valid: boolean;
	errors: TValidationError[];
};
