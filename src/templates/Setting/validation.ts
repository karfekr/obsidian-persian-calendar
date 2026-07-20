import { validatePattern } from "src/utils/dateEngine";

export type ValidationResult = {
	valid: boolean;
	message: string;
};

export type Validator = (value: string) => ValidationResult;

export const patternValidator: Validator = (value) => {
	const result = validatePattern(value);

	return {
		valid: result.valid,
		message: result.errors.map((error) => error.message).join("\n"),
	};
};
