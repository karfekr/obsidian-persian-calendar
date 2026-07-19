import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import SocialLinks from "src/components/SocialLinks";
import { getDirection, onLocalChange, setLocal, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TBoolSettingKeys, TLocal, TPathSuggestMode, TSetting } from "src/types";
import { validatePattern } from "src/utils/dateEngine";

import { PathSuggest } from "./PathSuggest";
import { renderEventSettingsSection } from "./sections/EventSettingsSection";
import { renderExtraCalendarSettingsSection } from "./sections/ExtraCalendarSettingsSection";
import { renderGeneralSettingsSection } from "./sections/GeneralSettingsSection";
import { renderHolidaySettingsSection } from "./sections/HolidaySettingsSection";
import { renderPathSettingsSection } from "./sections/PathSettingsSection";
import { renderTemplateSettingsSection } from "./sections/TemplateSettingsSection";

export default class CalendarSettingTab extends PluginSettingTab {
	readonly plugin: PersianCalendarPlugin;

	private unsubscribeLocale?: () => void;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	hide(): void {
		this.unsubscribeLocale?.();
		this.unsubscribeLocale = undefined;
	}

	display(): void {
		this.unsubscribeLocale?.();

		this.unsubscribeLocale = onLocalChange(() => {
			this.containerEl.setCssProps({
				direction: getDirection(),
			});
		});

		const { containerEl } = this;

		containerEl.empty();
		containerEl.addClass("persian-calendar");
		containerEl.setCssProps({
			direction: getDirection(),
		});

		const contactUs = containerEl.createEl("div", {
			cls: "persian-calendar__setting-banner",
		});

		const heading = contactUs.createEl("h3");

		onLocalChange(() => {
			heading.setText(t("setting.banner.title"));
		}, true);

		SocialLinks(contactUs);

		renderGeneralSettingsSection(this, containerEl);
		renderPathSettingsSection(this, containerEl);
		renderTemplateSettingsSection(this, containerEl);
		renderExtraCalendarSettingsSection(this, containerEl);
		renderHolidaySettingsSection(this, containerEl);
		renderEventSettingsSection(this, containerEl);
	}

	private trackSetting(setting: Setting, nameKey: string, descKey: string | null): void {
		onLocalChange(() => {
			setting.setName(t(nameKey));
			setting.setDesc(descKey ? t(descKey) : "");
		}, true);
	}

	addHeading(parent: HTMLElement, key: string): Setting {
		const element = new Setting(parent).setHeading();

		onLocalChange(() => {
			element.setName(t(key));
		}, true);

		return element;
	}

	addToggle(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string | null,
		key: TBoolSettingKeys,
		opts: { refresh?: boolean } = {},
	): void {
		const setting = new Setting(containerEl).addToggle((toggle) => {
			toggle.setValue(this.plugin.setting[key]).onChange(async (value) => {
				this.plugin.setting[key] = value;
				await this.plugin.saveSetting();

				if (opts.refresh) {
					this.plugin.refreshViews();
				}
			});
		});

		this.trackSetting(setting, nameKey, descKey);
	}

	addDropdown(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string | null,
		key: Extract<keyof TSetting, "language" | "dateFormat" | "weekendDays" | "hijriBase">,
		optionKeys: Record<string, string>,
		opts: { refresh?: boolean; isLanguage?: boolean } = {},
	): void {
		const setting = new Setting(containerEl).addDropdown((dropdown) => {
			const optionMap = new Map<HTMLOptionElement, string>();

			for (const [value, labelKey] of Object.entries(optionKeys)) {
				dropdown.addOption(value, "");
				optionMap.set(dropdown.selectEl.options[dropdown.selectEl.options.length - 1], labelKey);
			}

			onLocalChange(() => {
				for (const [option, labelKey] of optionMap) {
					option.textContent = t(labelKey);
				}
			}, true);

			dropdown.setValue(this.plugin.setting[key]).onChange(async (value) => {
				(this.plugin.setting[key] as string) = value;

				await this.plugin.saveSetting();

				if (opts.isLanguage) {
					setLocal(value as TLocal);
				}

				if (opts.refresh || opts.isLanguage) {
					this.plugin.refreshViews();
				}
			});
		});

		this.trackSetting(setting, nameKey, descKey);
	}

	addPath(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string | null,
		key: keyof TSetting,
		mode: TPathSuggestMode,
	): void {
		const setting = new Setting(containerEl).addText((text) => {
			text.setValue(this.plugin.setting[key] as string).onChange(async (value) => {
				(this.plugin.setting[key] as string) = value;
				await this.plugin.saveSetting();
			});

			new PathSuggest(this.app, text.inputEl, mode);
		});

		this.trackSetting(setting, nameKey, descKey);
	}

	addPatternField(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string | null,
		key: keyof TSetting,
	): void {
		const applyValidationFeedback = (inputEl: HTMLInputElement, value: string) => {
			const result = validatePattern(value);

			inputEl.toggleClass("persian-calendar__setting-input--invalid", !result.valid);
			inputEl.title = result.errors.map((error) => error.message).join("\n");
		};

		const setting = new Setting(containerEl).addText((text) => {
			text.setValue(this.plugin.setting[key] as string).onChange(async (value) => {
				(this.plugin.setting[key] as string) = value;
				applyValidationFeedback(text.inputEl, value);
				await this.plugin.saveSetting();
			});

			applyValidationFeedback(text.inputEl, text.inputEl.value);
		});

		this.trackSetting(setting, nameKey, descKey);
	}
}
