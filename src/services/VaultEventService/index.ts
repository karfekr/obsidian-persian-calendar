import { normalizePath } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TCustomEvent } from "src/types";
import { parseVaultEventsNote } from "src/utils/vaultEventUtils";

function resolveNotePath(path: string): string {
	const normalized = normalizePath(path.trim());
	if (!normalized) return "";
	return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

export default class VaultEventService {
	private cachedEvents: TCustomEvent[] = [];
	private refreshVersion = 0;

	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public getEvents(): TCustomEvent[] {
		return this.plugin.setting.showCustomEvents ? this.cachedEvents : [];
	}

	public isRelevantFile(filePath: string): boolean {
		return this.plugin.setting.vaultEventSources.some(
			(source) => source.enabled && resolveNotePath(source.path) === filePath,
		);
	}

	public moveSources(oldPath: string, newPath: string, isFolder: boolean): boolean {
		let moved = false;
		const sources = this.plugin.setting.vaultEventSources.map((source) => {
			const path = resolveNotePath(source.path);
			const matches = isFolder ? path.startsWith(`${oldPath}/`) : path === oldPath;
			if (!matches) return source;

			moved = true;
			return { ...source, path: newPath + path.slice(oldPath.length) };
		});
		if (moved) this.plugin.setting.vaultEventSources = sources;
		return moved;
	}

	public async refresh(): Promise<void> {
		const version = ++this.refreshVersion;
		const { vaultEventSources, hijriBase } = this.plugin.setting;
		const { vault } = this.plugin.app;
		const nextEvents: TCustomEvent[] = [];

		for (const source of vaultEventSources) {
			if (!source.enabled) continue;
			const file = vault.getFileByPath(resolveNotePath(source.path));
			if (!file) continue;

			try {
				const content = await vault.cachedRead(file);
				nextEvents.push(...parseVaultEventsNote(content, source, hijriBase));
			} catch {
				// A note can disappear during a read. Continue refreshing the other repositories.
			}
		}

		if (version !== this.refreshVersion) return;

		this.cachedEvents = nextEvents;
		this.plugin.liveExpression?.refresh();
	}
}
