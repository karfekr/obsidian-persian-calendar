import { normalizePath, TFile } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import type { TCustomEvent, TVaultEventSource } from "src/types";
import {
	extractEventsFromFrontmatter,
	matchesVaultSourcePath,
	normalizeVaultPath,
	parseVaultEventsNote,
} from "src/utils/vaultEventUtils";

export default class VaultEventService {
	private cachedEvents: TCustomEvent[] = [];

	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public getEvents(): TCustomEvent[] {
		return this.cachedEvents;
	}

	public isRelevantFile(filePath: string): boolean {
		const sources = this.plugin.setting.vaultEventSources ?? [];
		return sources.some((source) => {
			if (!source.enabled) return false;
			if (source.type === "frontmatter") {
				return matchesVaultSourcePath(filePath, source.path);
			}
			const notePath = this.resolveNotePath(source.path);
			return notePath !== "" && normalizeVaultPath(filePath) === notePath;
		});
	}

	private resolveNotePath(rawPath: string): string {
		const normalized = normalizeVaultPath(rawPath);
		if (!normalized) return "";
		return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
	}

	private getNoteFile(source: TVaultEventSource): TFile | null {
		const notePath = this.resolveNotePath(source.path);
		if (!notePath) return null;

		const file = this.plugin.app.vault.getAbstractFileByPath(normalizePath(notePath));
		return file instanceof TFile ? file : null;
	}

	public async refresh(): Promise<void> {
		const sources = (this.plugin.setting.vaultEventSources ?? []).filter(
			(source) => source.enabled,
		);
		if (sources.length === 0) {
			this.cachedEvents = [];
			return;
		}

		const fallbackCalendar = this.plugin.setting.dateFormat;
		const hasFrontmatterSources = sources.some((s) => s.type === "frontmatter");
		const markdownFiles = hasFrontmatterSources ? this.plugin.app.vault.getMarkdownFiles() : [];
		const nextEvents: TCustomEvent[] = [];

		for (const source of sources) {
			if (source.type === "frontmatter") {
				for (const file of markdownFiles) {
					const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					if (!frontmatter) continue;

					nextEvents.push(
						...extractEventsFromFrontmatter({
							filePath: file.path,
							fileBasename: file.basename,
							frontmatter,
							source,
							fallbackCalendar,
						}),
					);
				}
			} else if (source.type === "note") {
				const file = this.getNoteFile(source);
				if (!file) continue;

				const content = await this.plugin.app.vault.cachedRead(file);
				nextEvents.push(...parseVaultEventsNote(content, source, fallbackCalendar));
			}
		}

		this.cachedEvents = nextEvents;
	}
}
