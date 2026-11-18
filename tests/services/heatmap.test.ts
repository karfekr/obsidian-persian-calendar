import type { THeatmapDayCell } from "src/services/HeatmapService/heatmapUtils";
import {
	buildJalaliYearLayout,
	computeHeatmapSummary,
	computeIntensityLevel,
	countTasks,
	countWords,
	getJalaliSaturdayWeekday,
	parseHeatmapConfig,
	parseNumericProperty,
	stripFrontmatter,
} from "src/services/HeatmapService/heatmapUtils";
import { describe, expect, it } from "vitest";

describe("parseHeatmapConfig", () => {
	it("returns sensible defaults for an empty block", () => {
		expect(parseHeatmapConfig("", 1404)).toEqual({
			year: 1404,
			metric: "words",
			color: "green",
			showSummary: true,
			showLegend: true,
			showWeekdays: true,
			showMonths: true,
		});
	});

	it("parses Persian year digits and auto-infers property metric", () => {
		const config = parseHeatmapConfig(
			`
# my mood tracker
year: ۱۴۰۳
property: "mood"
color: purple
min: 1
max: 5
showSummary: false
legend: no
			`,
			1404,
		);

		expect(config).toEqual({
			year: 1403,
			metric: "property",
			property: "mood",
			color: "purple",
			min: 1,
			max: 5,
			showSummary: false,
			showLegend: false,
			showWeekdays: true,
			showMonths: true,
		});
	});

	it("parses task metric aliases", () => {
		expect(parseHeatmapConfig("metric: tasks", 1404).metric).toBe("tasks");
		expect(parseHeatmapConfig("metric: open-tasks", 1404).metric).toBe("tasks-open");
		expect(parseHeatmapConfig("metric: tasks-ratio", 1404).metric).toBe("tasks-ratio");
	});
});

describe("buildJalaliYearLayout", () => {
	it("builds 365 days for a non-leap Jalali year (1404) with 29 days in Esfand", () => {
		const layout = buildJalaliYearLayout(1404);
		expect(layout.isLeapYear).toBe(false);
		expect(layout.totalDays).toBe(365);
		expect(layout.monthStarts).toHaveLength(12);

		const esfandDays = layout.days.filter((d) => d.jm === 12);
		expect(esfandDays).toHaveLength(29);
		expect(layout.days.filter((d) => d.jm === 1)).toHaveLength(31);
		expect(layout.days.filter((d) => d.jm === 7)).toHaveLength(30);
	});

	it("builds 366 days for a leap Jalali year (1403) with 30 days in Esfand", () => {
		const layout = buildJalaliYearLayout(1403);
		expect(layout.isLeapYear).toBe(true);
		expect(layout.totalDays).toBe(366);

		const esfandDays = layout.days.filter((d) => d.jm === 12);
		expect(esfandDays).toHaveLength(30);
	});

	it("aligns weeks to Saturday-start (0 = Saturday .. 6 = Friday)", () => {
		const layout = buildJalaliYearLayout(1404);
		// 1404/01/01 is Friday (2025-03-21) -> Saturday-based index 6
		expect(getJalaliSaturdayWeekday(1404, 1, 1)).toBe(6);
		expect(layout.days[0]).toMatchObject({
			jy: 1404,
			jm: 1,
			jd: 1,
			weekIndex: 0,
			weekdayIndex: 6,
		});
		// Next day (1404/01/02) is Saturday -> weekIndex 1, weekdayIndex 0
		expect(layout.days[1]).toMatchObject({
			jy: 1404,
			jm: 1,
			jd: 2,
			weekIndex: 1,
			weekdayIndex: 0,
		});
		expect(layout.totalWeeks).toBe(53);
	});
});

describe("markdown metric extractors", () => {
	it("strips YAML frontmatter and counts Persian and English words", () => {
		const note = `---
title: روزنوشت
mood: 8
---
امروز روی پروژه کار کردم.
Today I wrote some tests.`;

		expect(stripFrontmatter(note)).toBe("امروز روی پروژه کار کردم.\nToday I wrote some tests.");
		expect(countWords(note)).toBe(10);
		expect(countWords("---\nmood: 5\n---\n")).toBe(0);
	});

	it("counts completed and open tasks while ignoring code fences", () => {
		const note = `---
tags: [daily]
---
- [x] Morning workout
* [X] Read book
- [ ] Write documentation
1. [ ] Review PR

\`\`\`markdown
- [x] Example inside code fence
- [ ] Should not be counted
\`\`\`
`;

		expect(countTasks(note)).toEqual({ completed: 2, open: 2 });
	});

	it("parses numeric frontmatter properties including Persian digits and booleans", () => {
		expect(parseNumericProperty(8)).toBe(8);
		expect(parseNumericProperty("7.5")).toBe(7.5);
		expect(parseNumericProperty("۱۲")).toBe(12);
		expect(parseNumericProperty(true)).toBe(1);
		expect(parseNumericProperty(false)).toBe(0);
		expect(parseNumericProperty("great")).toBeNull();
		expect(parseNumericProperty(null)).toBeNull();
	});
});

describe("intensity and summary calculations", () => {
	it("computes GitHub-style intensity levels 0..4", () => {
		expect(computeIntensityLevel(null, 0, 100)).toBe(0);
		expect(computeIntensityLevel(0, 0, 100)).toBe(0);
		expect(computeIntensityLevel(10, 0, 100)).toBe(1);
		expect(computeIntensityLevel(40, 0, 100)).toBe(2);
		expect(computeIntensityLevel(70, 0, 100)).toBe(3);
		expect(computeIntensityLevel(100, 0, 100)).toBe(4);
		expect(computeIntensityLevel(5, 5, 5)).toBe(4);
	});

	it("computes active days, totals, and streaks", () => {
		const layout = buildJalaliYearLayout(1404);
		const cells: THeatmapDayCell[] = layout.days.map((d, idx) => ({
			...d,
			hasNote: idx < 5,
			value: idx === 0 || idx === 1 || idx === 3 || idx === 4 ? 100 : null,
			level: idx === 0 || idx === 1 || idx === 3 || idx === 4 ? 2 : 0,
		}));

		const summary = computeHeatmapSummary(cells, "words", { jy: 1404, jm: 1, jd: 5 });
		expect(summary.activeDays).toBe(4);
		expect(summary.total).toBe(400);
		expect(summary.maxValue).toBe(100);
		expect(summary.average).toBe(100);
		expect(summary.longestStreak).toBe(2);
		expect(summary.currentStreak).toBe(2);
	});
});
