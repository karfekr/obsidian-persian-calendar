import type { TAbstractFile } from "obsidian";
import { debounce, TFile, TFolder } from "obsidian";
import type PersianCalendarPlugin from "src/main";

export default class EventManager {
	private isLayoutReady = false;
	private debouncedRefresh = debounce(() => {
		this.plugin.refreshCalendarViews();
	}, 50);
	private debouncedNavigationRefresh = debounce(() => {
		this.plugin.noteNavigation?.refreshAll();
	}, 50);
	private debouncedVaultEventsRefresh = debounce(() => {
		void this.plugin.vaultEventService.refresh().then(() => {
			this.plugin.refreshCalendarViews();
		});
	}, 150);

	constructor(private plugin: PersianCalendarPlugin) {
		this.plugin.app.workspace.onLayoutReady(() => {
			window.setTimeout(() => {
				this.isLayoutReady = true;
			}, 3000);
		});
	}

	registerEvents() {
		this.registerFileCreateEvent();
		this.registerFileModifyEvent();
		this.registerFileDeleteEvent();
		this.registerFileRenameEvent();
		this.plugin.registerEvent(
			this.plugin.app.metadataCache.on("changed", (file, _data, cache) => {
				this.plugin.periodicLinks.metadataChanged(file, cache.frontmatter);
			}),
		);
		this.plugin.registerEvent(
			this.plugin.app.metadataCache.on("resolved", () => this.plugin.periodicLinks.cacheResolved()),
		);
	}

	private registerFileCreateEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.plugin.periodicLinks.filesChanged(file);
					if (this.plugin.vaultEventService.isRelevantFile(file.path)) {
						this.debouncedVaultEventsRefresh();
					}
					this.debouncedNavigationRefresh();
					if (!this.isLayoutReady) return;

					window.setTimeout(() => {
						void this.plugin.placeholder.insertPersianDate(file);
					}, 300);
					this.debouncedRefresh();
				}
			}),
		);
	}

	private registerFileModifyEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					const isNewFile = Date.now() - file.stat.ctime < 2000;

					if (isNewFile) {
						await this.plugin.placeholder.insertPersianDate(file);
					}

					if (this.plugin.vaultEventService.isRelevantFile(file.path)) {
						this.debouncedVaultEventsRefresh();
					}
					this.debouncedRefresh();
				}
			}),
		);
	}

	private registerFileDeleteEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				if ((file instanceof TFile && file.path.endsWith(".md")) || file instanceof TFolder) {
					this.plugin.periodicLinks.filesChanged(file);
					if (file instanceof TFolder || this.plugin.vaultEventService.isRelevantFile(file.path)) {
						this.debouncedVaultEventsRefresh();
					}
					this.handleFileUpdate();
				}
			}),
		);
	}

	private registerFileRenameEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", async (file, oldPath) => {
				const isFolder = file instanceof TFolder;
				const isMarkdown = file instanceof TFile && file.path.endsWith(".md");
				const service = this.plugin.vaultEventService;
				const wasRelevant = service.isRelevantFile(oldPath);
				const moved = (isFolder || isMarkdown) && service.moveSources(oldPath, file.path, isFolder);

				if (isFolder || wasRelevant || (isMarkdown && service.isRelevantFile(file.path))) {
					this.debouncedVaultEventsRefresh();
				}

				if (isFolder || isMarkdown || oldPath.endsWith(".md")) {
					this.plugin.periodicLinks.filesChanged(file);
					this.handleFileUpdate();
				}
				if (moved) await this.plugin.saveSetting();
			}),
		);
	}

	private handleFileUpdate() {
		this.debouncedRefresh();
		this.debouncedNavigationRefresh();
	}
}
