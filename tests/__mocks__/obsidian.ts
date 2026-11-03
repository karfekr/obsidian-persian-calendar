export class TAbstractFile {
	path = "";
	name = "";
	parent: unknown = null;
	vault: unknown = null;
}

export class TFile extends TAbstractFile {
	stat: Record<string, unknown> = { ctime: 0, mtime: 0, size: 0 };
	basename = "";
	extension = "";

	constructor(path = "", basename = "") {
		super();
		this.path = path;
		this.basename =
			basename ||
			(path
				.split("/")
				.pop()
				?.replace(/\.[^/.]+$/, "") ??
				"");
	}
}

export class TFolder extends TAbstractFile {
	children: unknown[] = [];
	isRoot = () => false;
}

export class MarkdownView {
	file: unknown = null;
	leaf: unknown = null;
}

export class View {}
export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
export class Modal {}
export class Notice {}
export function setIcon() {}
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T): T {
	return fn;
}
export const Platform = { isMobile: false };
