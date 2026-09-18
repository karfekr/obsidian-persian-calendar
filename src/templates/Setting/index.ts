import type { App, SettingDefinitionItem } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import SocialLinks from "src/components/SocialLinks";
import { getDirection, onLocalChange, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import { getEventSettings } from "./sections/EventSection";
import { getExtraCalendarSettings } from "./sections/ExtraCalendarSection";
import { getGeneralSettings } from "./sections/GeneralSection";
import { getHolidaySettings } from "./sections/HolidaySection";
import { getNameSettings } from "./sections/NameSection";
import { getPathSettings } from "./sections/PathSection";
import { getTemplateSettings } from "./sections/TemplateSection";
import { createSettingChangeHandler, getNestedValue } from "./settingEffects";

export default class CalendarSettingTab extends PluginSettingTab {
	readonly plugin: PersianCalendarPlugin;

	private readonly applySettingChange: (key: string, value: unknown) => Promise<void>;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.applySettingChange = createSettingChangeHandler(plugin, () => this.update());
		this.plugin.register(onLocalChange(() => this.update()));
	}

	getControlValue(key: string): unknown {
		return getNestedValue(this.plugin.setting, key);
	}

	private renderBanner(setting: Setting): void {
		setting.settingEl.addClass("persian-calendar-banner");

		const contentEl = setting.settingEl.createDiv({
			cls: "persian-calendar-banner-content",
		});

		contentEl.createDiv({
			cls: "persian-calendar-banner-title",
			text: t("setting.banner.title"),
		});

		SocialLinks(contentEl);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await this.applySettingChange(key, value);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: "",
				searchable: false,
				render: (setting: Setting) => {
					setting.settingEl.empty();

					this.containerEl.addClass("persian-calendar");
					this.containerEl.style.direction = getDirection();

					this.renderBanner(new Setting(setting.settingEl));
				},
			},

			...getGeneralSettings(),
			...getPathSettings(this.plugin),
			...getNameSettings(),
			...getTemplateSettings(),
			...getExtraCalendarSettings(),
			...getHolidaySettings(),
			...getEventSettings(),
		];
	}
}
