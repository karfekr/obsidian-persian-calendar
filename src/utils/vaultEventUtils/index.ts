import type { TCustomEvent, TDateFormat, TVaultEventCalendar, TVaultEventSource } from "src/types";
import { toEnNumber } from "src/utils/formatters";

export type TParsedRecurringDate = {
	calendar: TDateFormat;
	month: number;
	day: number;
	originYear?: number;
};

const FULL_DATE_RE = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;
const MONTH_DAY_RE = /^(\d{1,2})[-/.](\d{1,2})$/;
const CALENDAR_PREFIX_RE = /^(?:\[(jalali|gregorian|hijri)\]|(jalali|gregorian|hijri):)\s*/i;
const NOTE_LINE_DATE_RE =
	/^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2})(?:\s*[|\-–—:]\s*|\s+)(.+)$/;
const LIST_PREFIX_RE = /^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;
const FRONTMATTER_BLOCK_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function normalizeVaultPath(path: string): string {
	return path.trim().replace(/^\/+|\/+$/g, "");
}

export function matchesVaultSourcePath(filePath: string, sourcePath: string): boolean {
	const normalizedSource = normalizeVaultPath(sourcePath);
	if (normalizedSource === "") return true;

	const normalizedFile = normalizeVaultPath(filePath);
	if (normalizedSource.endsWith(".md")) {
		return normalizedFile === normalizedSource;
	}

	return normalizedFile === normalizedSource || normalizedFile.startsWith(`${normalizedSource}/`);
}

function inferCalendar(
	year: number | undefined,
	calendarHint: TVaultEventCalendar,
	fallbackCalendar: TDateFormat,
): TDateFormat {
	if (calendarHint !== "auto") return calendarHint;
	if (year === undefined) return fallbackCalendar;
	if (year >= 1700) return "gregorian";
	if (year >= 1200) return "jalali";
	return fallbackCalendar;
}

export function parseRecurringDate(
	raw: unknown,
	calendarHint: TVaultEventCalendar,
	fallbackCalendar: TDateFormat = "jalali",
): TParsedRecurringDate | null {
	if (raw === null || raw === undefined) return null;

	if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
		const year = raw.getFullYear();
		const month = raw.getMonth() + 1;
		const day = raw.getDate();
		return {
			calendar: inferCalendar(year, calendarHint, fallbackCalendar),
			month,
			day,
			originYear: year,
		};
	}

	if (typeof raw !== "string") return null;

	const normalized = toEnNumber(raw.trim()).replace(/[T\s].*$/, "");
	if (!normalized) return null;

	const fullMatch = FULL_DATE_RE.exec(normalized);
	if (fullMatch) {
		const year = Number.parseInt(fullMatch[1], 10);
		const month = Number.parseInt(fullMatch[2], 10);
		const day = Number.parseInt(fullMatch[3], 10);
		if (month < 1 || month > 12 || day < 1 || day > 31) return null;

		return {
			calendar: inferCalendar(year, calendarHint, fallbackCalendar),
			month,
			day,
			originYear: year,
		};
	}

	const monthDayMatch = MONTH_DAY_RE.exec(normalized);
	if (monthDayMatch) {
		const month = Number.parseInt(monthDayMatch[1], 10);
		const day = Number.parseInt(monthDayMatch[2], 10);
		if (month < 1 || month > 12 || day < 1 || day > 31) return null;

		return {
			calendar: inferCalendar(undefined, calendarHint, fallbackCalendar),
			month,
			day,
		};
	}

	return null;
}

function formatFrontmatterTitle(
	fileBasename: string,
	property: string,
	originYear: number | undefined,
	titleTemplate?: string,
): string {
	const template = titleTemplate?.trim();
	if (template) {
		return template
			.replace(/\{name\}/g, fileBasename)
			.replace(/\{property\}/g, property)
			.replace(/\{year\}/g, originYear !== undefined ? String(originYear) : "")
			.trim();
	}

	return `${fileBasename} (${property})`;
}

export function extractEventsFromFrontmatter(params: {
	filePath: string;
	fileBasename: string;
	frontmatter: Record<string, unknown> | undefined;
	source: TVaultEventSource;
	fallbackCalendar?: TDateFormat;
}): TCustomEvent[] {
	const { filePath, fileBasename, frontmatter, source, fallbackCalendar = "jalali" } = params;

	if (!source.enabled || source.type !== "frontmatter" || !frontmatter) return [];

	const property = source.property?.trim();
	if (!property) return [];
	if (!matchesVaultSourcePath(filePath, source.path)) return [];

	const rawValue = frontmatter[property];
	if (rawValue === undefined || rawValue === null) return [];

	const values = Array.isArray(rawValue) ? rawValue : [rawValue];
	const events: TCustomEvent[] = [];

	values.forEach((value, index) => {
		const parsed = parseRecurringDate(value, source.calendar, fallbackCalendar);
		if (!parsed) return;

		const title = formatFrontmatterTitle(
			fileBasename,
			property,
			parsed.originYear,
			source.titleTemplate,
		);
		if (!title) return;

		events.push({
			id: `vault:${source.id}:${filePath}:${index}`,
			title,
			calendar: parsed.calendar,
			month: parsed.month,
			day: parsed.day,
			isHoliday: source.isHoliday,
			enabled: true,
		});
	});

	return events;
}

export function parseVaultEventsNote(
	content: string,
	source: TVaultEventSource,
	fallbackCalendar: TDateFormat = "jalali",
): TCustomEvent[] {
	if (!source.enabled || source.type !== "note") return [];

	const body = content.replace(FRONTMATTER_BLOCK_RE, "");
	const lines = body.split(/\r?\n/);
	const events: TCustomEvent[] = [];

	lines.forEach((rawLine, lineIndex) => {
		let line = rawLine.trim();
		if (!line || line.startsWith("#") || line.startsWith("%%")) return;

		line = line.replace(LIST_PREFIX_RE, "").trim();
		if (!line) return;

		let calendarHint: TVaultEventCalendar = source.calendar;
		const prefixMatch = CALENDAR_PREFIX_RE.exec(line);
		if (prefixMatch) {
			const matchedCal = (prefixMatch[1] ?? prefixMatch[2]).toLowerCase() as TDateFormat;
			calendarHint = matchedCal;
			line = line.slice(prefixMatch[0].length).trim();
		}

		const normalizedLine = toEnNumber(line);
		const lineMatch = NOTE_LINE_DATE_RE.exec(normalizedLine);
		if (!lineMatch) return;

		const datePart = lineMatch[1];
		const titleStart = normalizedLine.length - lineMatch[2].length;
		const title = line.slice(titleStart).trim();
		if (!title) return;

		const parsed = parseRecurringDate(datePart, calendarHint, fallbackCalendar);
		if (!parsed) return;

		events.push({
			id: `vault:${source.id}:line:${lineIndex}`,
			title,
			calendar: parsed.calendar,
			month: parsed.month,
			day: parsed.day,
			isHoliday: source.isHoliday,
			enabled: true,
		});
	});

	return events;
}
