import type { TAbstractFile } from "obsidian";
import { debounce, TFile, TFolder } from "obsidian";
import type PersianCalendarPlugin from "src/main";

export default class EventManager {
	private isLayoutReady = false;
	private debouncedRefresh = debounce(() => {
		this.plugin.refreshCalendarViews();
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
		this.registerMetadataChangeEvent();
	}

	private registerFileCreateEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					if (!this.isLayoutReady) return;

					window.setTimeout(() => {
						void this.plugin.placeholder.insertPersianDate(file);
					}, 300);
					if (this.plugin.vaultEventService.isRelevantFile(file.path)) {
						this.debouncedVaultEventsRefresh();
					}
					this.handleFileUpdate();
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
					this.handleFileUpdate();
				}
			}),
		);
	}

	private registerFileDeleteEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				if ((file instanceof TFile && file.path.endsWith(".md")) || file instanceof TFolder) {
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
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				if (
					file instanceof TFolder ||
					(file instanceof TFile &&
						file.path.endsWith(".md") &&
						(this.plugin.vaultEventService.isRelevantFile(file.path) ||
							this.plugin.vaultEventService.isRelevantFile(oldPath)))
				) {
					this.debouncedVaultEventsRefresh();
				}
			}),
		);
	}

	private registerMetadataChangeEvent() {
		this.plugin.registerEvent(
			this.plugin.app.metadataCache.on("changed", (file) => {
				if (file instanceof TFile && this.plugin.vaultEventService.isRelevantFile(file.path)) {
					this.debouncedVaultEventsRefresh();
				}
			}),
		);
	}

	private handleFileUpdate() {
		this.debouncedRefresh();
	}
}
