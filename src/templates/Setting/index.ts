import type { App } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import { SocialLinks } from "src/components/SocialLinks";
import { SettingBase } from "./SettingBase";
import { t } from "src/i18n";

export default class CalendarSetting extends SettingBase {
	icon = "calendar-heart";

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("persian-calendar");

		containerEl.style.direction = this.plugin.setting.language === "fa" ? "rtl" : "ltr";

		const contactUs = containerEl.createDiv({
			cls: "persian-calendar__setting-banner",
		});
		contactUs.createEl("h2", {
			text: t("setting.banner.title"),
		});
		SocialLinks(contactUs, this.plugin.setting.language);

		containerEl.createEl("h2", { text: t("setting.sections.general") });

		this.addDropdownSetting(containerEl, {
			name: t("setting.general.language.name"),
			desc: t("setting.general.language.desc"),
			key: "language",
			options: {
				fa: t("setting.general.language.options.fa"),
				en: t("setting.general.language.options.en"),
			},
			defaultValue: "en",
			refresh: true,
		});

		this.addDropdownSetting(containerEl, {
			name: t("setting.general.dateFormat.name"),
			desc: t("setting.general.dateFormat.desc"),
			key: "dateFormat",
			options: {
				jalali: t("setting.general.dateFormat.options.jalali"),
				gregorian: t("setting.general.dateFormat.options.gregorian"),
			},
			defaultValue: "gregorian",
			refresh: true,
		});

		this.addToggleSetting(containerEl, {
			name: t("setting.general.askBeforeCreate.name"),
			desc: t("setting.general.askBeforeCreate.desc"),
			key: "askForCreateNote",
			refresh: true,
		});

		this.addToggleSetting(containerEl, {
			name: t("setting.general.openDailyOnStartup.name"),
			desc: t("setting.general.openDailyOnStartup.desc"),
			key: "openDailyNoteOnStartup",
			refresh: true,
		});

		this.addToggleSetting(containerEl, {
			name: t("setting.general.showSeasons.name"),
			desc: t("setting.general.showSeasons.desc"),
			key: "showSeasonalNotes",
			refresh: true,
		});

		containerEl.createEl("h2", { text: t("setting.sections.paths") });

		this.addPathSetting(containerEl, t("setting.paths.daily.name"), "dailyNotesPath", {
			desc: t("setting.paths.daily.desc"),
			mode: "folder",
		});
		this.addPathSetting(containerEl, t("setting.paths.weekly.name"), "weeklyNotesPath", {
			desc: t("setting.paths.weekly.desc"),
			mode: "folder",
		});
		this.addPathSetting(containerEl, t("setting.paths.monthly.name"), "monthlyNotesPath", {
			desc: t("setting.paths.monthly.desc"),
			mode: "folder",
		});
		this.addPathSetting(containerEl, t("setting.paths.seasonal.name"), "seasonalNotesPath", {
			desc: t("setting.paths.seasonal.desc"),
			mode: "folder",
		});
		this.addPathSetting(containerEl, t("setting.paths.yearly.name"), "yearlyNotesPath", {
			desc: t("setting.paths.yearly.desc"),
			mode: "folder",
		});

		containerEl.createEl("h2", { text: t("setting.sections.templates") });

		this.addPathSetting(containerEl, t("setting.templates.daily.name"), "dailyTemplatePath", {
			desc: t("setting.templates.daily.desc"),
			mode: "md-file",
		});
		this.addPathSetting(containerEl, t("setting.templates.weekly.name"), "weeklyTemplatePath", {
			desc: t("setting.templates.weekly.desc"),
			mode: "md-file",
		});
		this.addPathSetting(containerEl, t("setting.templates.monthly.name"), "monthlyTemplatePath", {
			desc: t("setting.templates.monthly.desc"),
			mode: "md-file",
		});
		this.addPathSetting(containerEl, t("setting.templates.seasonal.name"), "seasonalTemplatePath", {
			desc: t("setting.templates.seasonal.desc"),
			mode: "md-file",
		});
		this.addPathSetting(containerEl, t("setting.templates.yearly.name"), "yearlyTemplatePath", {
			desc: t("setting.templates.yearly.desc"),
			mode: "md-file",
		});

		containerEl.createEl("h2", { text: t("setting.sections.extraCalendars") });

		this.addToggleSetting(containerEl, {
			name: t("setting.extraCalendars.showGregorian.name"),
			desc: t("setting.extraCalendars.showGregorian.desc"),
			key: "showGeorgianDates",
			refresh: true,
		});

		this.addToggleSetting(containerEl, {
			name: t("setting.extraCalendars.showHijri.name"),
			desc: t("setting.extraCalendars.showHijri.desc"),
			key: "showHijriDates",
			refresh: true,
		});

		this.addDropdownSetting(containerEl, {
			name: t("setting.extraCalendars.hijriBase.name"),
			desc: t("setting.extraCalendars.hijriBase.desc"),
			key: "hijriBase",
			options: {
				iran: t("setting.extraCalendars.hijriBase.options.iran"),
				umalqura: t("setting.extraCalendars.hijriBase.options.umalqura"),
			},
			defaultValue: "iran",
			refresh: true,
		});

		containerEl.createEl("h2", { text: t("setting.sections.holidays") });

		this.addToggleSetting(containerEl, {
			name: t("setting.holidays.showOfficial.name"),
			desc: t("setting.holidays.showOfficial.desc"),
			key: "showHolidays",
			refresh: true,
		});

		this.addDropdownSetting(containerEl, {
			name: t("setting.holidays.weekendDays.name"),
			desc: t("setting.holidays.weekendDays.desc"),
			key: "weekendDays",
			options: {
				friday: t("setting.holidays.weekendDays.options.friday"),
				"thursday-friday": t("setting.holidays.weekendDays.options.thursdayFriday"),
				"friday-saturday": t("setting.holidays.weekendDays.options.fridaySaturday"),
			},
			defaultValue: "friday",
			refresh: true,
		});

		containerEl.createEl("h2", { text: t("setting.sections.events") });

		this.addToggleSetting(containerEl, {
			name: t("setting.events.official.name"),
			key: "showIROfficialEvents",
		});
		this.addToggleSetting(containerEl, {
			name: t("setting.events.historical.name"),
			key: "showIRHistoricalEvents",
		});
		this.addToggleSetting(containerEl, {
			name: t("setting.events.ancient.name"),
			key: "showIRAncientEvents",
		});
		this.addToggleSetting(containerEl, {
			name: t("setting.events.global.name"),
			key: "showGlobalEvents",
		});
		this.addToggleSetting(containerEl, {
			name: t("setting.events.shia.name"),
			key: "showShiaEvents",
		});
		this.addToggleSetting(containerEl, {
			name: t("setting.events.sunni.name"),
			key: "showSunniEvents",
		});
	}
}
