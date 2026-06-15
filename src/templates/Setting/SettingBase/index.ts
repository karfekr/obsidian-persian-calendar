import { App, PluginSettingTab, Setting as ObsidianSettings } from "obsidian";
import { onLocalChange, setLocal } from "src/i18n";
import PersianCalendarPlugin from "src/main";
import type { TBoolSettingKeys, TLocal, TSetting } from "src/types";

import PathSuggest from "./PathSuggest";

export abstract class SettingBase extends PluginSettingTab {
	plugin: PersianCalendarPlugin;
	private unsubscribeLocale?: () => void;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		this.unsubscribeLocale = onLocalChange(() => {
			this.refresh();
		});
	}

	protected abstract render(): void;

	protected refresh(): void {
		this.containerEl.empty();
		this.render();
	}

	override hide(): void {
		super.hide();
		this.unsubscribeLocale?.();
	}

	protected addPathSetting(
		containerEl: HTMLElement,
		name: string,
		settingKey: keyof TSetting,
		opts?: {
			desc?: string;
			mode?: "folder" | "file" | "md-file";
		},
	): void {
		new ObsidianSettings(containerEl)
			.setName(name)
			.setDesc(opts?.desc ?? "")
			.addText((text) => {
				text
					.setPlaceholder("")
					.setValue(this.plugin.setting[settingKey] as string)
					.onChange((value) => {
						(this.plugin.setting[settingKey] as string) = value;

						void this.plugin.saveSetting();
					});

				new PathSuggest(this.app, text.inputEl, opts?.mode ?? "folder");
			});
	}

	protected addToggleSetting(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: TBoolSettingKeys;
			refresh?: boolean;
		},
	): void {
		new ObsidianSettings(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.setting[opts.key]).onChange((value) => {
					this.plugin.setting[opts.key] = value;
					void this.plugin.saveSetting();
					if (opts.refresh) {
						this.plugin.refreshViews();
					}
				});
			});
	}

	protected addDropdownSetting(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: Extract<keyof TSetting, "dateFormat" | "weekendDays" | "hijriBase" | "language">;
			options: Record<string, string>;
			defaultValue: string;
			refresh?: boolean;
		},
	): void {
		new ObsidianSettings(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(opts.options)) {
					dropdown.addOption(value, label);
				}

				dropdown.setValue(this.plugin.setting[opts.key]).onChange((value) => {
					(this.plugin.setting[opts.key] as string) = value;

					void this.plugin.saveSetting();

					if (opts.key === "language") {
						setLocal(value as TLocal);
					}

					if (opts.refresh || opts.key === "language") {
						this.plugin.refreshViews();
					}
				});
			});
	}
}
