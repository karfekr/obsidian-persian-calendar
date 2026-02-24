import type { EditorSuggestContext } from "obsidian";
import type { IRAN_HIJRI_MONTHS } from "src/constants";

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

export type TEventRecord = Record<number, Record<number, TEventObject[]>>;

export type TEventCategory = "official" | "historical" | "ancient" | "shia" | "sunni" | "global";

export type TEventObject = {
	isHoliday: boolean;
	categories: TEventCategory[];
	title: {
		fa: string;
		en: string;
	};
};

export type TDayMap = Map<number, TEventObject[]>;
export type TMonthMap = Map<number, TDayMap>;

export type TGetDayOfWeek = { jYear: number; jWeekNumber: number };

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
	versionUpdate: boolean;
	askForCreateNote: boolean;
	openDailyNoteOnStartup: boolean;
	dateFormat: TDateFormatWithoutHijri;
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

export type TLocal = "fa" | "en";

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
	isHoliday: boolean;
};

export type TSuggestProvider = {
	trigger: RegExp;
	getSuggestions: (query: string) => string[];
	onSelect: (value: string, ctx: EditorSuggestContext) => string;
};

export type TReleaseNote = {
	version: string;
	changes: string[];
};

export type TSocialLink = {
	href: string;
	title: string;
	icon: string;
};

export type TPathTokenContext = {
	jy?: number;
	jm?: number;
	season?: number;
	local?: TLocal;
};
