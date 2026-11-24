import type { Extension } from "@codemirror/state";
import type { MarkdownPostProcessorContext } from "obsidian";
import { MarkdownRenderChild } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TSetting, TSuggestProvider } from "src/types";
import { nowTehran } from "src/utils/dateUtils";
import { toEnNumber, toFaNumber } from "src/utils/formatters";

import { createLiveExpressionEditorExtension } from "./livePreviewExtension";
import type { TLiveExpressionCadence } from "./registry";
import { ExpressionContext, findExpression, LIVE_EXPRESSION_KEYS } from "./registry";

export type { TLiveExpressionCadence } from "./registry";
export { LIVE_EXPRESSION_KEYS } from "./registry";

export const LIVE_EXPRESSION_PATTERN = /\{\+([^{}+]+)\}/g;

const LIVE_EXPRESSION_SETTING_KEYS = new Set<keyof TSetting>([
	"liveExpressionNumeralLanguage",
	"liveExpressionOutputLanguage",
	"weekCalculation",
	"hijriBase",
	"showIROfficialEvents",
	"showIRHistoricalEvents",
	"showIRAncientEvents",
	"showShiaEvents",
	"showSunniEvents",
	"showGlobalEvents",
	"showCustomEvents",
	"vaultEventSources",
]);

export function isLiveExpressionSetting(key: keyof TSetting): boolean {
	return LIVE_EXPRESSION_SETTING_KEYS.has(key);
}

const SKIPPED_TAG_NAMES = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);

type RenderedExpressionEntry = {
	el: HTMLElement;
	key: string;
	cadence: TLiveExpressionCadence;
};

class LiveExpressionRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private readonly entries: RenderedExpressionEntry[],
		private readonly liveExpression: LiveExpression,
	) {
		super(containerEl);
	}

	onload(): void {
		for (const entry of this.entries) {
			const unsubscribe = this.liveExpression.subscribe(entry.cadence, () => {
				const nextValue = this.liveExpression.calculateValue(entry.key);
				if (nextValue !== null && entry.el.textContent !== String(nextValue)) {
					entry.el.textContent = String(nextValue);
				}
			});
			this.register(unsubscribe);
		}
	}
}

function shouldSkipElement(el: Element | null): boolean {
	let current: Element | null = el;
	while (current) {
		if (SKIPPED_TAG_NAMES.has(current.tagName)) return true;
		if (current.classList?.contains("persian-live-expression")) return true;
		current = current.parentElement;
	}
	return false;
}

export default class LiveExpression {
	plugin: PersianCalendarPlugin;

	private readonly listeners: Record<TLiveExpressionCadence, Set<() => void>> = {
		second: new Set(),
		minute: new Set(),
		day: new Set(),
	};

	private secondInterval: ReturnType<typeof globalThis.setInterval> | null = null;
	private minuteAlignTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
	private minuteInterval: ReturnType<typeof globalThis.setInterval> | null = null;
	private dayTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
	private documentResumeListenerRegistered = false;
	private windowResumeListenerRegistered = false;
	private lastResumeAt = Number.NEGATIVE_INFINITY;

	private readonly handleVisibilityChange = () => {
		if (typeof document === "undefined" || document.visibilityState !== "hidden") {
			this.refreshAfterResume();
		}
	};

	private readonly handleWindowFocus = () => {
		if (typeof document === "undefined" || document.visibilityState !== "hidden") {
			this.refreshAfterResume();
		}
	};

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
		this.registerResumeListeners();
	}

	public getCadence(keyword: string): TLiveExpressionCadence {
		return findExpression(keyword)?.cadence ?? "day";
	}

	public getActiveListenerCount(cadence?: TLiveExpressionCadence): number {
		if (cadence) return this.listeners[cadence].size;
		return this.listeners.second.size + this.listeners.minute.size + this.listeners.day.size;
	}

	public subscribe(cadence: TLiveExpressionCadence, listener: () => void): () => void {
		const bucket = this.listeners[cadence];
		bucket.add(listener);

		if (bucket.size === 1) {
			this.startCadenceTimer(cadence);
		}

		return () => {
			bucket.delete(listener);
			if (bucket.size === 0) {
				this.stopCadenceTimer(cadence);
			}
		};
	}

	private notifyCadence(cadence: TLiveExpressionCadence): void {
		for (const listener of [...this.listeners[cadence]]) {
			listener();
		}
	}

	public refresh(): void {
		this.notifyCadence("second");
		this.notifyCadence("minute");
		this.notifyCadence("day");
	}

	private registerResumeListeners(): void {
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", this.handleVisibilityChange);
			this.documentResumeListenerRegistered = true;
		}

		if (typeof window !== "undefined") {
			window.addEventListener("focus", this.handleWindowFocus);
			this.windowResumeListenerRegistered = true;
		}
	}

	private refreshAfterResume(): void {
		const resumedAt = Date.now();
		if (resumedAt - this.lastResumeAt < 100) return;
		this.lastResumeAt = resumedAt;

		this.refresh();

		for (const cadence of ["second", "minute", "day"] as const) {
			if (this.listeners[cadence].size === 0) continue;
			this.stopCadenceTimer(cadence);
			this.startCadenceTimer(cadence);
		}
	}

	private startCadenceTimer(cadence: TLiveExpressionCadence): void {
		if (cadence === "second") {
			if (this.secondInterval !== null) return;
			this.secondInterval = globalThis.setInterval(() => {
				this.notifyCadence("second");
			}, 1000);
			return;
		}

		if (cadence === "minute") {
			if (this.minuteAlignTimeout !== null || this.minuteInterval !== null) return;
			const zdt = nowTehran();
			const msUntilNextMinute = Math.max(50, (60 - zdt.second) * 1000 - zdt.millisecond);
			this.minuteAlignTimeout = globalThis.setTimeout(() => {
				this.minuteAlignTimeout = null;
				this.notifyCadence("minute");
				if (this.listeners.minute.size > 0) {
					this.minuteInterval = globalThis.setInterval(() => {
						this.notifyCadence("minute");
					}, 60_000);
				}
			}, msUntilNextMinute);
			return;
		}

		this.scheduleNextDayTick();
	}

	private scheduleNextDayTick(): void {
		if (this.dayTimeout !== null || this.listeners.day.size === 0) return;

		const zdt = nowTehran();
		const secondsUntilMidnight = (24 - zdt.hour) * 3600 - zdt.minute * 60 - zdt.second;
		const msUntilMidnight = Math.max(1000, secondsUntilMidnight * 1000 - zdt.millisecond + 100);

		this.dayTimeout = globalThis.setTimeout(() => {
			this.dayTimeout = null;
			this.notifyCadence("day");
			this.scheduleNextDayTick();
		}, msUntilMidnight);
	}

	private stopCadenceTimer(cadence: TLiveExpressionCadence): void {
		if (cadence === "second") {
			if (this.secondInterval !== null) {
				globalThis.clearInterval(this.secondInterval);
				this.secondInterval = null;
			}
			return;
		}

		if (cadence === "minute") {
			if (this.minuteAlignTimeout !== null) {
				globalThis.clearTimeout(this.minuteAlignTimeout);
				this.minuteAlignTimeout = null;
			}
			if (this.minuteInterval !== null) {
				globalThis.clearInterval(this.minuteInterval);
				this.minuteInterval = null;
			}
			return;
		}

		if (this.dayTimeout !== null) {
			globalThis.clearTimeout(this.dayTimeout);
			this.dayTimeout = null;
		}
	}

	public destroy(): void {
		this.stopCadenceTimer("second");
		this.stopCadenceTimer("minute");
		this.stopCadenceTimer("day");
		this.listeners.second.clear();
		this.listeners.minute.clear();
		this.listeners.day.clear();

		if (this.documentResumeListenerRegistered && typeof document !== "undefined") {
			document.removeEventListener("visibilitychange", this.handleVisibilityChange);
			this.documentResumeListenerRegistered = false;
		}
		if (this.windowResumeListenerRegistered && typeof window !== "undefined") {
			window.removeEventListener("focus", this.handleWindowFocus);
			this.windowResumeListenerRegistered = false;
		}
	}

	public calculateValue(key: string): string | null {
		const expression = findExpression(key);
		if (!expression) return null;

		const value = expression.evaluate(new ExpressionContext(this.plugin));
		if (value === null) return null;
		const normalized = toEnNumber(String(value));
		return this.plugin.setting.liveExpressionNumeralLanguage === "fa"
			? toFaNumber(normalized)
			: normalized;
	}

	public handlePostProcess(element: HTMLElement, context: MarkdownPostProcessorContext): void {
		const ownerDoc = element.ownerDocument;
		if (!ownerDoc) return;

		const textNodes: Text[] = [];
		const walker = ownerDoc.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);

		let currentNode = walker.nextNode();
		while (currentNode) {
			const textNode = currentNode as Text;
			if (textNode.nodeValue?.includes("{+") && !shouldSkipElement(textNode.parentElement)) {
				textNodes.push(textNode);
			}
			currentNode = walker.nextNode();
		}

		if (textNodes.length === 0) return;

		const renderedEntries: RenderedExpressionEntry[] = [];

		for (const textNode of textNodes) {
			const rawText = textNode.nodeValue ?? "";
			const regex = new RegExp(LIVE_EXPRESSION_PATTERN.source, "g");
			let lastIndex = 0;
			let hasReplacement = false;
			const fragment = ownerDoc.createDocumentFragment();

			for (const match of rawText.matchAll(regex)) {
				const matchIndex = match.index ?? 0;
				const key = match[1];
				const value = this.calculateValue(key);
				if (value === null) continue;

				if (matchIndex > lastIndex) {
					fragment.appendChild(ownerDoc.createTextNode(rawText.slice(lastIndex, matchIndex)));
				}

				const span = ownerDoc.createElement("span");
				span.className = "persian-live-expression";
				span.dataset.key = key;
				span.textContent = String(value);
				fragment.appendChild(span);

				renderedEntries.push({
					el: span,
					key,
					cadence: this.getCadence(key),
				});

				lastIndex = matchIndex + match[0].length;
				hasReplacement = true;
			}

			if (hasReplacement) {
				if (lastIndex < rawText.length) {
					fragment.appendChild(ownerDoc.createTextNode(rawText.slice(lastIndex)));
				}
				textNode.parentNode?.replaceChild(fragment, textNode);
			}
		}

		if (renderedEntries.length > 0) {
			context.addChild(new LiveExpressionRenderChild(element, renderedEntries, this));
		}
	}

	public createEditorExtension(): Extension {
		return createLiveExpressionEditorExtension(this);
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /(?<!\{)\{\+[^}]*$/,
			getSuggestions: (query: string) => {
				const search = query.trim();
				return LIVE_EXPRESSION_KEYS.filter((key) => key.includes(search)).map((key) => `{+${key}}`);
			},
			onSelect: (value: string) => value,
		};
	}
}
