import type { TLocal } from "src/types";

import en from "./local/en.json";
import fa from "./local/fa.json";

const translations = {
	en,
	fa,
} as const;

let currentLocal: TLocal = "en";
const listeners = new Set<() => void>();

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
	let current: unknown = obj;
	const parts = path.split(".");

	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}
	return current;
}

export function setLocal(lang: TLocal) {
	currentLocal = lang;
	listeners.forEach((cb) => {
		cb();
	});
}

export function getDirection() {
	return currentLocal === "fa" ? "rtl" : "ltr";
}

export function getLocal() {
	return currentLocal;
}

export function onLocalChange(cb: () => void, immediate = false) {
	if (immediate) {
		cb();
	}

	listeners.add(cb);

	return () => {
		listeners.delete(cb);
	};
}

export function t(key: string): string {
	const result = resolvePath(translations[currentLocal], key);
	if (typeof result === "string") return result;

	const fallback = resolvePath(translations.en, key);
	if (typeof fallback === "string") return fallback;

	return key;
}
