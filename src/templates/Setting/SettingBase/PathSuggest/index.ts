import { App, TAbstractFile, TFile, TFolder, AbstractInputSuggest } from "obsidian";

export type PathSuggestMode = "folder" | "file" | "md-file";

export default class PathSuggest extends AbstractInputSuggest<TAbstractFile> {
	private inputEl: HTMLInputElement;
	private mode: PathSuggestMode;

	constructor(app: App, inputEl: HTMLInputElement, mode: PathSuggestMode = "folder") {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.mode = mode;
	}

	getSuggestions(query: string): TAbstractFile[] {
		const q = query.toLowerCase();

		let candidates: TAbstractFile[];

		switch (this.mode) {
			case "folder":
				candidates = this.app.vault.getAllFolders();
				break;
			case "md-file":
				candidates = this.app.vault.getMarkdownFiles();
				break;
			case "file":
				candidates = this.app.vault.getFiles();
				break;
		}

		return !q ? candidates : candidates.filter((f) => f.path.toLowerCase().includes(q));
	}

	renderSuggestion(file: TAbstractFile, el: HTMLElement) {
		el.setText(file.path);
	}

	selectSuggestion(file: TAbstractFile) {
		this.inputEl.value = file.path;
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
