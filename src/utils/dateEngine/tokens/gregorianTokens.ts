import { GREGORIAN_MONTHS_NAME } from "src/constants";

import type { TTokenDefinition } from "src/types";
import { createNameToken, createNumericToken } from "./tokenFactories";

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

	createNumericToken({ token: "WW", family: "gregorian", field: "week", digits: 2, pad: true }),
	createNumericToken({ token: "W", family: "gregorian", field: "week", digits: 2, pad: false }),
];
