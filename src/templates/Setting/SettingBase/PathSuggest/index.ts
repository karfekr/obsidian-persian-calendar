import { App, AbstractInputSuggest } from "obsidian";

export type PathSuggestMode = "folder" | "file" | "md-file";

export default class PathSuggest extends AbstractInputSuggest<string> {
	private mode: PathSuggestMode;
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement, mode: PathSuggestMode = "folder") {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.mode = mode;
	}

	async getSuggestions(query: string): Promise<string[]> {
		const lastSlash = query.lastIndexOf("/");
		const dirPath = lastSlash >= 0 ? query.substring(0, lastSlash) : "";
		const partial = query.substring(lastSlash + 1).toLowerCase();

		const isHidden = (p: string) => p.split("/").some((part) => part.startsWith("."));

		try {
			const listed = await this.app.vault.adapter.list(dirPath || "/");

			let entries: string[] = [];

			if (this.mode === "folder") {
				entries = listed.folders;
			} else if (this.mode === "md-file") {
				entries = [...listed.folders, ...listed.files.filter((f) => f.endsWith(".md"))];
			} else {
				entries = [...listed.folders, ...listed.files];
			}

			return entries.filter((e) => !isHidden(e) && e.toLowerCase().includes(partial)).slice(0, 20);
		} catch {
			return [];
		}
	}

	renderSuggestion(path: string, el: HTMLElement) {
		el.setText(path);
	}

	selectSuggestion(path: string) {
		this.setValue(path);
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
