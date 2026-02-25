import en from "./local/en.json";
import fa from "./local/fa.json";
import type { TLocal } from "src/types";

const translations = {
	en,
	fa,
} as const;

let currentLocal: TLocal = "en";
let listeners: (() => void)[] = [];

function resolvePath(obj: any, path: string): string | undefined {
	return path.split(".").reduce((acc, part) => {
		if (acc && typeof acc === "object") {
			return acc[part];
		}
		return undefined;
	}, obj);
}

//? Public Functions
export function setLocal(lang: TLocal) {
	currentLocal = lang;
	listeners.forEach((cb) => cb());
}

export function getDirection() {
	return currentLocal === "fa" ? "rtl" : "ltr";
}

export function getLocal() {
	return currentLocal;
}

export function onLocalChange(cb: () => void) {
	listeners.push(cb);
}

export function t(key: string): string {
	const result = resolvePath(translations[currentLocal], key);

	if (typeof result === "string") return result;

	const fallback = resolvePath(translations.en, key);
	if (typeof fallback === "string") return fallback;

	return key;
}
