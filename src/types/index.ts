import type { App, EditorSuggestContext } from "obsidian";
import type { IRAN_HIJRI_MONTHS } from "src/constants";
import type { SettingsController } from "src/templates/Setting/SettingsController";

// jalali = هجری شمسی/خورشیدی
export type TJalali = {
	jy: number;
	jm: number;
	jd: number;
};

// gregorian = میلادی
export type TGregorian = {
	gy: number;
	gm: number;
	gd: number;
};

// hijri = هجری قمری
export type THijri = {
	hy: number;
	hm: number;
	hd: number;
};

export type TWeekStart = "sat" | "sun" | "mon";

export type TWeekCalculationMode =
	| "jalali-first-day-of-year"
	| "jalali-first-week-start"
	| "gregorian-first-day-of-year"
	| "gregorian-first-week-start";

export type TGetJalaliDayOfWeek = { jYear: number; jWeekNumber: number };
export type TGetGregorianDayOfWeek = {
	gYear: number;
	gWeekNumber: number;
};

export type TSupportedHijriYear = keyof typeof IRAN_HIJRI_MONTHS;

export type TDateFormat = "jalali" | "gregorian" | "hijri";
export type THijriBase = "iran" | "umalqura";

export type TDateFormatWithoutHijri = Exclude<TDateFormat, "hijri">;

export type TShowEvents = {
	showIROfficialEvents?: boolean;
	showIRHistoricalEvents?: boolean;
	showIRAncientEvents?: boolean;
	showShiaEvents?: boolean;
	showSunniEvents?: boolean;
	showGlobalEvents?: boolean;
};

export type THijriAnchor = TGregorian & THijri;

export type TBoolSettingKeys = Extract<
	keyof TSetting,
	| "showSeasonalNotes"
	| "showGeorgianDates"
	| "showHijriDates"
	| "showHolidays"
	| "showIROfficialEvents"
	| "showIRHistoricalEvents"
	| "showIRAncientEvents"
	| "showShiaEvents"
	| "showSunniEvents"
	| "showGlobalEvents"
	| "askForCreateNote"
	| "openDailyNoteOnStartup"
>;

export type TSetting = {
	lastSeenVersion?: string;
	language: TLocale;
	versionUpdate: boolean;
	askForCreateNote: boolean;
	openDailyNoteOnStartup: boolean;
	dateFormat: TDateFormatWithoutHijri;
	dailyNoteFormat: string;
	weekCalculationMode: TWeekCalculationMode;
	showSeasonalNotes: boolean;
	// show holidays
	showHolidays: boolean;
	weekendDays: "thursday-friday" | "friday" | "friday-saturday";
	// show dates
	hijriBase: THijriBase;
	showGeorgianDates: boolean;
	showHijriDates: boolean;
	// notes folder path
	dailyNotesPath: string;
	weeklyNotesPath: string;
	monthlyNotesPath: string;
	seasonalNotesPath: string;
	yearlyNotesPath: string;
	// template folder path
	dailyTemplatePath: string;
	weeklyTemplatePath: string;
	monthlyTemplatePath: string;
	seasonalTemplatePath: string;
	yearlyTemplatePath: string;
	// show events
	showIROfficialEvents: boolean;
	showIRHistoricalEvents: boolean;
	showIRAncientEvents: boolean;
	showShiaEvents: boolean;
	showSunniEvents: boolean;
	showGlobalEvents: boolean;
};

//? Utility type that extracts the keys of TSetting whose values are assignable to V.
type KeysOfType<V> = { [K in keyof TSetting]-?: TSetting[K] extends V ? K : never }[keyof TSetting];
export type BoolKey = KeysOfType<boolean>;
export type StringKey = KeysOfType<string>;

export type TLocale = "fa" | "en";
export type TDirection = "rtl" | "ltr";

export type TBuildContext = {
	currentDate: Date;
	fileDate: Date | null;
	fileName: string;
	baseDate: TDateFormat;
};

export type TMonthGridCell = TJalali & {
	date: Date;
	gregorian: TGregorian;
	hijri: THijri;
	index: number;
	row: number;
	column: number;
	isInCurrentMonth: boolean;
	isToday: boolean;
	isWeekend: boolean;
	isHolidayInIran: boolean;
};

export type TSuggestProvider = {
	trigger: RegExp;
	getSuggestions: (query: string) => string[];
	onSelect: (value: string, ctx: EditorSuggestContext) => string;
};

export type TReleaseNote = {
	version: string;
	changes: {
		fa: string[];
		en: string[];
	};
};

export type TSocialLink = {
	href: string;
	title: string;
	icon: string;
};

export type TPathSuggestMode = "folder" | "file" | "md-file";

export type TCalendarFamily = "gregorian" | "jalali";

export type TDateEngineContext = {
	gy?: number;
	gm?: number;
	gd?: number;
	jy?: number;
	jm?: number;
	jd?: number;
	week?: number;
	season?: number;
};

export type TTokenField = keyof TDateEngineContext;

export type TTokenDefinition = {
	token: string;
	family: TCalendarFamily;
	field: TTokenField;
	format: (ctx: TDateEngineContext) => string | null;
	regexFragment: (locale: TLocale) => string;
	parseValue: (raw: string) => number | null;
};

export type TPatternSegment =
	| { type: "literal"; value: string; escaped?: boolean }
	| { type: "token"; token: TTokenDefinition };

export type TCompiledPattern = {
	pattern: string;
	locale: TLocale;
	segments: TPatternSegment[];
	regex: RegExp;
	fields: TTokenField[];
};

export type TValidationSeverity = "error" | "warning";

export type TValidationError = {
	type: "empty-pattern" | "unknown-token" | "ambiguous-adjacent-numeric" | "duplicate-field";
	severity: TValidationSeverity;
	message: string;
	token?: string;
};

export type TValidationResult = {
	valid: boolean;
	errors: TValidationError[];
};

export type SectionContext = {
	app: App;
	controller: SettingsController;
};

export type SectionRenderer = (ctx: SectionContext, containerEl: HTMLElement) => void;

export type TWeekCalculator = {
	getWeekNumber(date: Date, weekStart?: TWeekStart): { jy: number; weekNumber: number };
	getStartOfWeek(jYear: number, jWeekNumber: number, weekStart?: TWeekStart): TJalali & TGregorian;
	getEndOfWeek(jYear: number, jWeekNumber: number, weekStart?: TWeekStart): TJalali & TGregorian;
};
