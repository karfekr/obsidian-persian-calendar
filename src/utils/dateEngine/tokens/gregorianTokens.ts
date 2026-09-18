import { GREGORIAN_MONTHS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TTokenDefinition, TLocale } from "src/types";
import { createNameToken, createNumericToken } from "./tokenFactories";

const GREGORIAN_SEASONS_NAME: Record<TLocale, Record<number, string>> = {
	fa: { 1: "Spring", 2: "Summer", 3: "Autumn", 4: "Winter" },
	en: { 1: "Spring", 2: "Summer", 3: "Autumn", 4: "Winter" },
};

const GREGORIAN_SEASONS_SHORT_NAME: Record<TLocale, Record<number, string>> = {
	fa: { 1: "Spr", 2: "Sum", 3: "Aut", 4: "Win" },
	en: { 1: "Spr", 2: "Sum", 3: "Aut", 4: "Win" },
};

export const gregorianTokens: TTokenDefinition[] = [
	createNumericToken({ token: "YYYY", family: "gregorian", field: "gy", digits: 4, pad: true }),
	createNumericToken({
		token: "YY",
		family: "gregorian",
		field: "gy",
		digits: 2,
		pad: true,
		encode: (y) => ((y % 100) + 100) % 100,
	}),

	createNameToken({
		token: "MMMM",
		family: "gregorian",
		field: "gm",
		namesByLocale: GREGORIAN_MONTHS_NAME,
	}),
	createNameToken({
		token: "MMM",
		family: "gregorian",
		field: "gm",
		namesByLocale: GREGORIAN_MONTHS_NAME,
		abbreviate: true,
	}),
	createNumericToken({ token: "MM", family: "gregorian", field: "gm", digits: 2, pad: true }),
	createNumericToken({ token: "M", family: "gregorian", field: "gm", digits: 2, pad: false }),

	createNumericToken({ token: "DD", family: "gregorian", field: "gd", digits: 2, pad: true }),
	createNumericToken({ token: "D", family: "gregorian", field: "gd", digits: 2, pad: false }),
	createNumericToken({ token: "Q", family: "gregorian", field: "quarter", digits: 1, pad: false }),
	createNumericToken({ token: "QQ", family: "gregorian", field: "quarter", digits: 2, pad: true }),
	createNameToken({
		token: "QQQ",
		family: "gregorian",
		field: "quarter",
		namesByLocale: GREGORIAN_SEASONS_SHORT_NAME,
	}),
	createNameToken({
		token: "QQQQ",
		family: "gregorian",
		field: "quarter",
		namesByLocale: GREGORIAN_SEASONS_NAME,
	}),

	createNameToken({
		token: "DDDD",
		family: "gregorian",
		field: "dow",
		namesByLocale: WEEKDAYS_NAME,
	}),
];
