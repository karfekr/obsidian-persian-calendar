import type { TJalali } from "src/types";
import {
	checkKabiseh,
	getWeekdayTehran,
	jalaliMonthLength,
	jalaliToCalendarDate,
} from "src/utils/dateUtils";
import { toEnNumber } from "src/utils/formatters";

export type THeatmapMetric = "words" | "tasks" | "tasks-open" | "tasks-ratio" | "property";

export type THeatmapColor = "green" | "blue" | "purple" | "orange" | "red";

export type THeatmapConfig = {
	year: number;
	metric: THeatmapMetric;
	property?: string;
	color: THeatmapColor;
	title?: string;
	min?: number;
	max?: number;
	showSummary: boolean;
	showLegend: boolean;
	showWeekdays: boolean;
	showMonths: boolean;
};

export type THeatmapDayLayout = {
	jy: number;
	jm: number;
	jd: number;
	weekIndex: number;
	weekdayIndex: number;
};

export type THeatmapMonthStart = {
	jm: number;
	weekIndex: number;
};

export type THeatmapYearLayout = {
	jy: number;
	isLeapYear: boolean;
	totalDays: number;
	totalWeeks: number;
	days: THeatmapDayLayout[];
	monthStarts: THeatmapMonthStart[];
};

export type THeatmapDayCell = THeatmapDayLayout & {
	value: number | null;
	hasNote: boolean;
	completedTasks?: number;
	openTasks?: number;
	level: 0 | 1 | 2 | 3 | 4;
};

export type THeatmapSummary = {
	activeDays: number;
	total: number;
	maxValue: number;
	average: number;
	longestStreak: number;
	currentStreak: number;
	totalCompletedTasks: number;
	totalOpenTasks: number;
};

const VALID_COLORS = new Set<THeatmapColor>(["green", "blue", "purple", "orange", "red"]);

function unquote(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

function parseBooleanOption(raw: string, fallback: boolean): boolean {
	const normalized = raw.trim().toLowerCase();
	if (normalized === "true" || normalized === "yes" || normalized === "1") return true;
	if (normalized === "false" || normalized === "no" || normalized === "0") return false;
	return fallback;
}

function parseNumberOption(raw: string): number | undefined {
	const normalized = toEnNumber(unquote(raw));
	if (normalized === "") return undefined;
	const num = Number(normalized);
	return Number.isFinite(num) ? num : undefined;
}

function parseMetricOption(raw: string): THeatmapMetric | undefined {
	const normalized = unquote(raw).toLowerCase();
	switch (normalized) {
		case "words":
		case "word":
		case "word_count":
		case "wordcount":
			return "words";
		case "tasks":
		case "task":
		case "tasks-completed":
		case "tasks_completed":
		case "completed":
			return "tasks";
		case "tasks-open":
		case "tasks_open":
		case "open-tasks":
		case "open_tasks":
		case "open":
			return "tasks-open";
		case "tasks-ratio":
		case "tasks_ratio":
		case "task-ratio":
		case "completion":
			return "tasks-ratio";
		case "property":
		case "frontmatter":
		case "prop":
			return "property";
		default:
			return undefined;
	}
}

/**
 * Parse key-value configuration from a `persian-heatmap` code block body.
 */
export function parseHeatmapConfig(source: string, defaultYear: number): THeatmapConfig {
	const config: THeatmapConfig = {
		year: defaultYear,
		metric: "words",
		color: "green",
		showSummary: true,
		showLegend: true,
		showWeekdays: true,
		showMonths: true,
	};

	let hasExplicitMetric = false;

	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;

		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.slice(0, colonIndex).trim().toLowerCase();
		const rawValue = line.slice(colonIndex + 1).trim();
		if (!rawValue) continue;

		switch (key) {
			case "year": {
				const parsedYear = parseNumberOption(rawValue);
				if (parsedYear !== undefined && Number.isInteger(parsedYear) && parsedYear >= 1) {
					config.year = parsedYear;
				}
				break;
			}
			case "metric": {
				const parsedMetric = parseMetricOption(rawValue);
				if (parsedMetric) {
					config.metric = parsedMetric;
					hasExplicitMetric = true;
				}
				break;
			}
			case "property":
			case "prop":
			case "frontmatter": {
				const propName = unquote(rawValue);
				if (propName) {
					config.property = propName;
				}
				break;
			}
			case "color":
			case "theme": {
				const color = unquote(rawValue).toLowerCase() as THeatmapColor;
				if (VALID_COLORS.has(color)) {
					config.color = color;
				}
				break;
			}
			case "title": {
				const title = unquote(rawValue);
				if (title) {
					config.title = title;
				}
				break;
			}
			case "min": {
				config.min = parseNumberOption(rawValue);
				break;
			}
			case "max": {
				config.max = parseNumberOption(rawValue);
				break;
			}
			case "showsummary":
			case "show_summary":
			case "summary": {
				config.showSummary = parseBooleanOption(rawValue, config.showSummary);
				break;
			}
			case "showlegend":
			case "show_legend":
			case "legend": {
				config.showLegend = parseBooleanOption(rawValue, config.showLegend);
				break;
			}
			case "showweekdays":
			case "show_weekdays":
			case "weekdays": {
				config.showWeekdays = parseBooleanOption(rawValue, config.showWeekdays);
				break;
			}
			case "showmonths":
			case "show_months":
			case "months": {
				config.showMonths = parseBooleanOption(rawValue, config.showMonths);
				break;
			}
		}
	}

	if (!hasExplicitMetric && config.property) {
		config.metric = "property";
	}

	return config;
}

/**
 * Strip leading YAML frontmatter from markdown note content.
 */
export function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
	if (match) {
		return content.slice(match[0].length);
	}
	const emptyMatch = content.match(/^---\r?\n---(?:\r?\n|$)/);
	if (emptyMatch) {
		return content.slice(emptyMatch[0].length);
	}
	return content;
}

/**
 * Count words in markdown content (excluding YAML frontmatter).
 */
export function countWords(content: string): number {
	const body = stripFrontmatter(content).trim();
	if (!body) return 0;
	return body.split(/\s+/).filter((token) => token.length > 0).length;
}

const TASK_LINE_REGEX = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]/;
const FENCE_REGEX = /^\s*(?:```|~~~)/;

/**
 * Count completed and open markdown tasks in note content (excluding frontmatter and code fences).
 */
export function countTasks(content: string): { completed: number; open: number } {
	const body = stripFrontmatter(content);
	let completed = 0;
	let open = 0;
	let inCodeFence = false;

	for (const line of body.split(/\r?\n/)) {
		if (FENCE_REGEX.test(line)) {
			inCodeFence = !inCodeFence;
			continue;
		}
		if (inCodeFence) continue;

		const match = line.match(TASK_LINE_REGEX);
		if (!match) continue;

		if (match[1] === " ") {
			open++;
		} else {
			completed++;
		}
	}

	return { completed, open };
}

/**
 * Parse a frontmatter property value into a finite number, or null if non-numeric.
 */
export function parseNumericProperty(raw: unknown): number | null {
	if (typeof raw === "number") {
		return Number.isFinite(raw) ? raw : null;
	}
	if (typeof raw === "boolean") {
		return raw ? 1 : 0;
	}
	if (typeof raw === "string") {
		const normalized = toEnNumber(raw).trim();
		if (!normalized) return null;
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

/**
 * Return Saturday-based weekday index for a Jalali date:
 * 0 = Saturday, 1 = Sunday, ..., 6 = Friday.
 */
export function getJalaliSaturdayWeekday(jy: number, jm: number, jd: number): number {
	const weekday = getWeekdayTehran(jalaliToCalendarDate(jy, jm, jd));
	return (weekday + 1) % 7;
}

/**
 * Build the complete 7-row Saturday-start grid layout for a Jalali year
 * (Farvardin 1 through Esfand 29/30).
 */
export function buildJalaliYearLayout(jy: number): THeatmapYearLayout {
	const isLeapYear = checkKabiseh(jy);
	const startOffset = getJalaliSaturdayWeekday(jy, 1, 1);
	const days: THeatmapDayLayout[] = [];
	const monthStarts: THeatmapMonthStart[] = [];

	let dayIndex = 0;
	for (let jm = 1; jm <= 12; jm++) {
		const monthDays = jalaliMonthLength(jy, jm);
		for (let jd = 1; jd <= monthDays; jd++) {
			const gridSlot = startOffset + dayIndex;
			const weekIndex = Math.floor(gridSlot / 7);
			const weekdayIndex = gridSlot % 7;

			if (jd === 1) {
				monthStarts.push({ jm, weekIndex });
			}

			days.push({
				jy,
				jm,
				jd,
				weekIndex,
				weekdayIndex,
			});
			dayIndex++;
		}
	}

	const totalDays = days.length;
	const totalWeeks = Math.ceil((startOffset + totalDays) / 7);

	return {
		jy,
		isLeapYear,
		totalDays,
		totalWeeks,
		days,
		monthStarts,
	};
}

/**
 * Map a numeric value into GitHub-style intensity levels 0..4.
 */
export function computeIntensityLevel(
	value: number | null,
	min: number,
	max: number,
): 0 | 1 | 2 | 3 | 4 {
	if (value === null) return 0;
	if (min >= 0 && value <= 0) return 0;
	if (max <= min) return value > 0 || min < 0 ? 4 : 0;

	const clamped = Math.max(min, Math.min(max, value));
	const ratio = (clamped - min) / (max - min);

	if (ratio <= 0) return min < 0 ? 1 : 0;
	if (ratio <= 0.25) return 1;
	if (ratio <= 0.5) return 2;
	if (ratio <= 0.75) return 3;
	return 4;
}

function isCellActive(cell: THeatmapDayCell, metric: THeatmapMetric): boolean {
	if (!cell.hasNote) return false;
	if (metric === "tasks") {
		return (cell.completedTasks ?? 0) > 0;
	}
	if (metric === "tasks-open") {
		return (cell.openTasks ?? 0) > 0;
	}
	if (metric === "property") {
		return cell.value !== null && (cell.value > 0 || cell.level > 0);
	}
	return cell.value !== null && cell.value > 0;
}

/**
 * Compute summary statistics (active days, totals, averages, and streaks) for a Jalali year heatmap.
 */
export function computeHeatmapSummary(
	cells: THeatmapDayCell[],
	metric: THeatmapMetric,
	today?: TJalali,
): THeatmapSummary {
	let activeDays = 0;
	let total = 0;
	let maxValue = 0;
	let hasAnyValue = false;
	let longestStreak = 0;
	let runningStreak = 0;
	let totalCompletedTasks = 0;
	let totalOpenTasks = 0;

	for (const cell of cells) {
		totalCompletedTasks += cell.completedTasks ?? 0;
		totalOpenTasks += cell.openTasks ?? 0;

		if (cell.value !== null) {
			total += cell.value;
			if (!hasAnyValue || cell.value > maxValue) {
				maxValue = cell.value;
				hasAnyValue = true;
			}
		}

		if (isCellActive(cell, metric)) {
			activeDays++;
			runningStreak++;
			if (runningStreak > longestStreak) {
				longestStreak = runningStreak;
			}
		} else {
			runningStreak = 0;
		}
	}

	let currentStreak = 0;
	if (today && cells.length > 0 && cells[0].jy === today.jy) {
		const todayIndex = cells.findIndex(
			(c) => c.jy === today.jy && c.jm === today.jm && c.jd === today.jd,
		);
		if (todayIndex !== -1) {
			let idx = isCellActive(cells[todayIndex], metric) ? todayIndex : todayIndex - 1;
			while (idx >= 0 && isCellActive(cells[idx], metric)) {
				currentStreak++;
				idx--;
			}
		}
	}

	const numericCount = cells.filter((c) => c.value !== null).length;
	const average = numericCount > 0 ? total / numericCount : 0;

	return {
		activeDays,
		total,
		maxValue,
		average,
		longestStreak,
		currentStreak,
		totalCompletedTasks,
		totalOpenTasks,
	};
}
