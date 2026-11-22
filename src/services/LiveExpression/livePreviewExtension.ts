import type { Extension } from "@codemirror/state";
import { RangeSetBuilder } from "@codemirror/state";
import type { DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { Decoration, ViewPlugin, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";

import type LiveExpression from "./index";
import type { TLiveExpressionCadence } from "./index";
import { LIVE_EXPRESSION_PATTERN } from "./index";

const widgetCleanups = new WeakMap<HTMLElement, () => void>();

function findInlineCodeRanges(lineText: string): Array<[number, number]> {
	const ranges: Array<[number, number]> = [];
	let i = 0;

	while (i < lineText.length) {
		if (lineText[i] !== "`") {
			i++;
			continue;
		}

		let ticks = 0;
		while (i + ticks < lineText.length && lineText[i + ticks] === "`") {
			ticks++;
		}

		const start = i;
		const delimiter = "`".repeat(ticks);
		const closeIndex = lineText.indexOf(delimiter, i + ticks);

		if (closeIndex !== -1) {
			ranges.push([start, closeIndex + ticks]);
			i = closeIndex + ticks;
		} else {
			i += ticks;
		}
	}

	return ranges;
}

function isInsideRanges(start: number, end: number, ranges: Array<[number, number]>): boolean {
	return ranges.some(([rStart, rEnd]) => start >= rStart && end <= rEnd);
}

class LiveExpressionWidget extends WidgetType {
	constructor(
		private readonly key: string,
		private readonly initialValue: string,
		private readonly cadence: TLiveExpressionCadence,
		private readonly liveExpression: LiveExpression,
	) {
		super();
	}

	eq(other: LiveExpressionWidget): boolean {
		return other.key === this.key;
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "persian-live-expression";
		span.dataset.key = this.key;
		span.textContent = this.initialValue;

		const unsubscribe = this.liveExpression.subscribe(this.cadence, () => {
			const nextValue = this.liveExpression.calculateValue(this.key);
			if (nextValue !== null && span.textContent !== String(nextValue)) {
				span.textContent = String(nextValue);
			}
		});

		widgetCleanups.set(span, unsubscribe);
		return span;
	}

	destroy(dom: HTMLElement): void {
		const cleanup = widgetCleanups.get(dom);
		if (cleanup) {
			cleanup();
			widgetCleanups.delete(dom);
		}
	}
}

export function createLiveExpressionEditorExtension(liveExpression: LiveExpression): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate): void {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			private buildDecorations(view: EditorView): DecorationSet {
				if (!view.state.field(editorLivePreviewField, false)) {
					return Decoration.none;
				}

				const builder = new RangeSetBuilder<Decoration>();
				const selectionRanges = view.state.selection.ranges;

				const doc = view.state.doc;
				let inFencedCodeBlock = false;
				let processedUpToLine = 0;

				for (const { from, to } of view.visibleRanges) {
					const startLineNum = doc.lineAt(from).number;
					const endLineNum = doc.lineAt(to).number;

					// Track fenced code blocks from the start of the document up to startLineNum
					for (let ln = processedUpToLine + 1; ln < startLineNum; ln++) {
						const trimmed = doc.line(ln).text.trimStart();
						if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
							inFencedCodeBlock = !inFencedCodeBlock;
						}
					}
					processedUpToLine = Math.max(processedUpToLine, startLineNum - 1);

					for (let ln = startLineNum; ln <= endLineNum; ln++) {
						const line = doc.line(ln);
						processedUpToLine = ln;
						const trimmed = line.text.trimStart();

						if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
							inFencedCodeBlock = !inFencedCodeBlock;
							continue;
						}

						if (inFencedCodeBlock || !line.text.includes("{+")) {
							continue;
						}

						const codeRanges = findInlineCodeRanges(line.text);
						const regex = new RegExp(LIVE_EXPRESSION_PATTERN.source, "g");

						for (const match of line.text.matchAll(regex)) {
							const matchIndex = match.index ?? 0;
							const matchEnd = matchIndex + match[0].length;

							if (isInsideRanges(matchIndex, matchEnd, codeRanges)) continue;

							const absFrom = line.from + matchIndex;
							const absTo = line.from + matchEnd;

							const isCursorInside = selectionRanges.some(
								(range) => range.from <= absTo && range.to >= absFrom,
							);
							if (isCursorInside) continue;

							const key = match[1];
							const value = liveExpression.calculateValue(key);
							if (value === null) continue;

							const cadence = liveExpression.getCadence(key);
							builder.add(
								absFrom,
								absTo,
								Decoration.replace({
									widget: new LiveExpressionWidget(key, String(value), cadence, liveExpression),
								}),
							);
						}
					}
				}

				return builder.finish();
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		},
	);
}
