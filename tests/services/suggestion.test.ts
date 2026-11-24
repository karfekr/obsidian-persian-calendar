import { TFile } from "obsidian";
import Suggestion from "src/services/Suggestion";
import type { TSuggestProvider } from "src/types";

class SuggestionElement {
	children: SuggestionElement[] = [];
	dir = "";
	textContent = "";

	constructor(readonly tagName = "div") {}

	createDiv(options?: { text?: string }): SuggestionElement {
		const child = new SuggestionElement();
		child.textContent = options?.text ?? "";
		this.children.push(child);
		return child;
	}

	createEl(tagName: string, options?: { text?: string }): SuggestionElement {
		const child = new SuggestionElement(tagName);
		child.textContent = options?.text ?? "";
		this.children.push(child);
		return child;
	}
}

describe("Suggestion", () => {
	const value = "{+مناسبت امروز}";
	const provider: TSuggestProvider = {
		trigger: /(?<!\{)\{\+[^}]*$/,
		getSuggestions: () => [value],
		onSelect: (selection) => selection,
	};

	function createSuggestion() {
		const file = Object.assign(new TFile(), { path: "Dashboard.md" });
		const app = { workspace: { getActiveFile: () => file } };
		return new Suggestion(app as never, [provider]);
	}

	it.each(["rtl", "ltr"] as const)("isolates a live expression in a %s menu", (direction) => {
		const menu = new SuggestionElement();
		menu.dir = direction;

		createSuggestion().renderSuggestion(value, menu as never);

		const token = menu.children[0].children[0];
		expect(token.tagName).toBe("bdi");
		expect(token.dir).toBe("ltr");
		expect(token.children.map((child) => child.textContent).join("")).toBe(value);
		expect(token.children[1].tagName).toBe("bdi");
		expect(token.children[1].dir).toBe("auto");
	});

	it("uses the same text for the menu item, parser trigger, and insertion", () => {
		const suggestion = createSuggestion();
		const line = `کارها ${value}`;
		const replaceRange = vi.fn();
		const editor = {
			getLine: () => line,
			getRange: () => "}",
			replaceRange,
		};
		const cursor = { line: 0, ch: line.length - 1 };

		const context = suggestion.onTrigger(cursor, editor as never);
		expect(context?.query).toBe("مناسبت امروز");
		expect(context && suggestion.getSuggestions(context)).toEqual([value]);

		suggestion.selectSuggestion(value);
		expect(replaceRange).toHaveBeenCalledWith(
			value,
			{ line: 0, ch: line.indexOf("{+") },
			{ line: 0, ch: line.length },
		);
	});
});
