export class DatePatternFormatError extends Error {
	public readonly pattern: string;
	public readonly token: string;

	constructor(pattern: string, token: string) {
		super(
			`Cannot format pattern "${pattern}": missing context value required by token "${token}".`,
		);
		this.name = "DatePatternFormatError";
		this.pattern = pattern;
		this.token = token;
	}
}
