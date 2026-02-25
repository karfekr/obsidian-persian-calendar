import { App, PluginSettingTab, Setting as ObsidianSettings } from "obsidian";
import PersianCalendarPlugin from "src/main";
import PathSuggest from "./PathSuggest";
import type { TSetting, TBoolSettingKeys, TLocal } from "src/types";
import { onLocalChange, setLocal } from "src/i18n";

export abstract class SettingBase extends PluginSettingTab {
	plugin: PersianCalendarPlugin;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		onLocalChange(() => this.display());
	}

	protected addPathSetting(
		containerEl: HTMLElement,
		name: string,
		settingKey: keyof TSetting,
		opts?: {
			desc?: string;
			mode?: "folder" | "file" | "md-file";
		},
	) {
		new ObsidianSettings(containerEl)
			.setName(name)
			.setDesc(opts?.desc ?? "")
			.addText((text) => {
				text
					.setPlaceholder("")
					.setValue(this.plugin.setting[settingKey] as string)
					.onChange(async (value) => {
						(this.plugin.setting[settingKey] as string) = value;
						await this.plugin.saveSetting();
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
	) {
		new ObsidianSettings(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.setting[opts.key]).onChange(async (value) => {
					this.plugin.setting[opts.key] = value;
					await this.plugin.saveSetting();
					if (opts.refresh) this.plugin.refreshViews();
				}),
			);
	}

	protected addDropdownSetting<T extends string = string>(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: Extract<keyof TSetting, "dateFormat" | "weekendDays" | "hijriBase" | "language">;
			options: Record<string, string>;
			defaultValue: string;
			refresh?: boolean;
		},
	) {
		new ObsidianSettings(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addDropdown((dropdown) => {
				Object.entries(opts.options).forEach(([value, label]) =>
					dropdown.addOption(value as string, label as string),
				);

				dropdown
					.setValue(this.plugin.setting[opts.key] ?? opts.defaultValue)
					.onChange(async (value) => {
						(this.plugin.setting[opts.key] as any) = value as T;
						await this.plugin.saveSetting();

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
