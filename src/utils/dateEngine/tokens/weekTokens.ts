import type { TTokenDefinition } from "src/types";
import { createNumericToken } from "./tokenFactories";

export const weekTokens: TTokenDefinition[] = [
	createNumericToken({
		token: "ww",
		family: "between",
		field: "week",
		digits: 2,
		pad: true,
	}),
	createNumericToken({
		token: "w",
		family: "between",
		field: "week",
		digits: 2,
		pad: false,
	}),
];
