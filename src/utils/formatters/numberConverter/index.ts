export function toFaNumber(input: number | string) {
	return String(input)
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
		.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
}

export function toArNumber(input: number | string) {
	return String(input)
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
		.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1584));
}

export function toEnNumber(input: string) {
	return input
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}
