import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";

import type { TTokenDefinition } from "src/types";
import { createNameToken, createNumericToken } from "./tokenFactories";

export const jalaliTokens: TTokenDefinition[] = [
	createNumericToken({ token: "jYYYY", family: "jalali", field: "jy", digits: 4, pad: true }),
	createNumericToken({
		token: "jYY",
		family: "jalali",
		field: "jy",
		digits: 2,
		pad: true,
		encode: (y) => ((y % 100) + 100) % 100,
	}),

	createNameToken({
		token: "jMMMM",
		family: "jalali",
		field: "jm",
		namesByLocale: JALALI_MONTHS_NAME,
	}),
	createNameToken({
		token: "jMMM",
		family: "jalali",
		field: "jm",
		namesByLocale: JALALI_MONTHS_NAME,
		abbreviate: true,
	}),
	createNumericToken({ token: "jMM", family: "jalali", field: "jm", digits: 2, pad: true }),
	createNumericToken({ token: "jM", family: "jalali", field: "jm", digits: 2, pad: false }),

	createNumericToken({ token: "jDD", family: "jalali", field: "jd", digits: 2, pad: true }),
	createNumericToken({ token: "jD", family: "jalali", field: "jd", digits: 2, pad: false }),

	createNameToken({
		token: "jQQQQ",
		family: "jalali",
		field: "season",
		namesByLocale: SEASONS_NAME,
	}),
	createNumericToken({ token: "jQQ", family: "jalali", field: "season", digits: 2, pad: true }),
	createNumericToken({ token: "jQ", family: "jalali", field: "season", digits: 1, pad: false }),
];
