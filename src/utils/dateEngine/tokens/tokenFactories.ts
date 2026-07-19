import type { TCalendarFamily, TLocale, TTokenDefinition, TTokenField } from "src/types";
import { escapeRegex } from "../utils";

export function createNumericToken(opts: {
	token: string;
	family: TCalendarFamily;
	field: TTokenField;
	digits: number;
	pad: boolean;
	encode?: (value: number) => number;
}): TTokenDefinition {
	return {
		token: opts.token,
		family: opts.family,
		field: opts.field,
		format: (ctx) => {
			const raw = ctx[opts.field];
			if (raw === undefined || Number.isNaN(raw)) return null;

			const value = opts.encode ? opts.encode(raw) : raw;
			const str = String(Math.trunc(value));

			return opts.pad ? str.padStart(opts.digits, "0") : str;
		},
		regexFragment: () => (opts.pad ? `(\\d{${opts.digits}})` : `(\\d{1,${opts.digits}})`),
		parseValue: (raw) => {
			const num = Number(raw);
			return Number.isFinite(num) ? num : null;
		},
	};
}

export function createNameToken(opts: {
	token: string;
	family: TCalendarFamily;
	field: TTokenField;
	namesByLocale: Record<TLocale, Record<number, string>>;
	abbreviate?: boolean;
	local?: TLocale;
}): TTokenDefinition {
	const reverseMapCache = new Map<TLocale, Map<string, number>>();

	const getNames = (locale: TLocale = opts.local ?? "en") => opts.namesByLocale[locale];

	const toLabel = (name: string) => (opts.abbreviate ? name.slice(0, 3) : name);

	const getReverseMap = (locale: TLocale): Map<string, number> => {
		const cached = reverseMapCache.get(locale);
		if (cached) return cached;

		const map = new Map<string, number>();
		const names = getNames(locale);

		for (const key of Object.keys(names)) {
			const index = Number(key);
			map.set(toLabel(names[index]), index);
		}

		reverseMapCache.set(locale, map);
		return map;
	};

	return {
		token: opts.token,
		family: opts.family,
		field: opts.field,

		format: (ctx, locale) => {
			const raw = ctx[opts.field];
			if (raw === undefined) return null;

			const name = getNames(locale)[raw];
			return name ? toLabel(name) : null;
		},

		regexFragment: (locale) => {
			const labels = Array.from(getReverseMap(locale).keys()).sort((a, b) => b.length - a.length);

			return `(${labels.map(escapeRegex).join("|")})`;
		},

		parseValue: (raw, locale) => {
			const map = getReverseMap(locale);
			return map.has(raw) ? (map.get(raw) as number) : null;
		},
	};
}
