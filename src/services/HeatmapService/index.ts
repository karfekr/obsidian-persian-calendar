import type { MarkdownPostProcessorContext, TAbstractFile } from "obsidian";
import { debounce, MarkdownRenderChild, setIcon, TFile } from "obsidian";
import { JALALI_MONTHS_NAME, WEEKDAYS_NAME } from "src/constants";
import { onLocalChange, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TJalali, TLocale } from "src/types";
import { dateToJalali, todayTehran } from "src/utils/dateUtils";
import { toFaNumber } from "src/utils/formatters";
import type { THeatmapConfig, THeatmapDayCell, THeatmapSummary } from "./heatmapUtils";
import {
	buildJalaliYearLayout,
	computeHeatmapSummary,
	computeIntensityLevel,
	countTasks,
	countWords,
	parseHeatmapConfig,
	parseNumericProperty,
} from "./heatmapUtils";

export {
	buildJalaliYearLayout,
	computeHeatmapSummary,
	computeIntensityLevel,
	countTasks,
	countWords,
	getJalaliSaturdayWeekday,
	parseHeatmapConfig,
	parseNumericProperty,
	stripFrontmatter,
} from "./heatmapUtils";

const DISPLAYED_WEEKDAY_ROWS = new Set([0, 2, 4, 6]); // Sat, Mon, Wed, Fri

function formatNumber(value: number, locale: TLocale): string {
	const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
	return locale === "fa" ? toFaNumber(rounded) : rounded;
}

class HeatmapRenderChild extends MarkdownRenderChild {
	private currentYear: number | null = null;
	private renderGeneration = 0;
	private unsubscribeLocale?: () => void;
	private tooltipEl: HTMLDivElement | null = null;

	constructor(
		containerEl: HTMLElement,
		private readonly source: string,
		private readonly plugin: PersianCalendarPlugin,
	) {
		super(containerEl);
	}

	onload() {
		void this.render();

		const debouncedRender = debounce(() => {
			void this.render();
		}, 300);

		const onVaultEvent = (file: TAbstractFile) => {
			if (file instanceof TFile && file.extension === "md") {
				debouncedRender();
			}
		};

		this.registerEvent(this.plugin.app.vault.on("create", onVaultEvent));
		this.registerEvent(this.plugin.app.vault.on("modify", onVaultEvent));
		this.registerEvent(this.plugin.app.vault.on("delete", onVaultEvent));
		this.registerEvent(this.plugin.app.vault.on("rename", onVaultEvent));
		this.registerEvent(
			this.plugin.app.metadataCache.on("changed", (file) => {
				if (file.extension === "md") {
					debouncedRender();
				}
			}),
		);

		this.unsubscribeLocale = onLocalChange(() => {
			void this.render();
		});
	}

	onunload() {
		this.unsubscribeLocale?.();
		this.hideTooltip();
	}

	private async render() {
		const generation = ++this.renderGeneration;
		const today = dateToJalali(todayTehran());
		const config = parseHeatmapConfig(this.source, today.jy);
		const activeYear = this.currentYear ?? config.year;
		const locale: TLocale = this.plugin.setting.language === "en" ? "en" : "fa";

		if (config.metric === "property" && !config.property) {
			this.containerEl.empty();
			const errorEl = this.containerEl.createDiv({ cls: "persian-heatmap persian-heatmap--error" });
			errorEl.setAttribute("dir", locale === "fa" ? "rtl" : "ltr");
			errorEl.setText(t("heatmap.errors.missingProperty"));
			return;
		}

		const cells = await this.collectYearCells(activeYear, config);
		if (generation !== this.renderGeneration) return;

		const summary = computeHeatmapSummary(cells, config.metric, today);
		const layout = buildJalaliYearLayout(activeYear);

		this.containerEl.empty();
		const root = this.containerEl.createDiv({
			cls: "persian-heatmap",
		});
		root.setAttribute("dir", locale === "fa" ? "rtl" : "ltr");
		root.dataset.color = config.color;

		this.renderHeader(root, activeYear, config, locale);
		this.renderGrid(root, layout, cells, config, today, locale);

		if (config.showSummary || config.showLegend) {
			this.renderFooter(root, summary, config, locale);
		}
	}

	private async collectYearCells(jy: number, config: THeatmapConfig): Promise<THeatmapDayCell[]> {
		const layout = buildJalaliYearLayout(jy);

		type TRawDay = {
			day: (typeof layout.days)[number];
			hasNote: boolean;
			value: number | null;
			completedTasks?: number;
			openTasks?: number;
		};

		const rawDays: TRawDay[] = await Promise.all(
			layout.days.map(async (day) => {
				const file = this.plugin.noteService.getDailyNoteFile(day.jy, day.jm, day.jd);
				if (!file) {
					return { day, hasNote: false, value: null };
				}

				if (config.metric === "property") {
					const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					const rawVal = config.property ? frontmatter?.[config.property] : undefined;
					return {
						day,
						hasNote: true,
						value: parseNumericProperty(rawVal),
					};
				}

				const content = await this.plugin.app.vault.cachedRead(file);
				if (config.metric === "words") {
					return {
						day,
						hasNote: true,
						value: countWords(content),
					};
				}

				const { completed, open } = countTasks(content);
				let value: number | null = completed;
				if (config.metric === "tasks-open") {
					value = open;
				} else if (config.metric === "tasks-ratio") {
					const total = completed + open;
					value = total > 0 ? Math.round((completed / total) * 100) : null;
				}

				return {
					day,
					hasNote: true,
					value,
					completedTasks: completed,
					openTasks: open,
				};
			}),
		);

		const numericValues = rawDays
			.map((d) => d.value)
			.filter((v): v is number => v !== null && (config.min !== undefined || v > 0));

		const autoMin = config.min ?? 0;
		const autoMax =
			config.max ??
			(config.metric === "tasks-ratio"
				? 100
				: numericValues.length > 0
					? Math.max(...numericValues)
					: 0);

		return rawDays.map((raw) => ({
			...raw.day,
			hasNote: raw.hasNote,
			value: raw.value,
			completedTasks: raw.completedTasks,
			openTasks: raw.openTasks,
			level: computeIntensityLevel(raw.value, autoMin, autoMax),
		}));
	}

	private renderHeader(
		root: HTMLElement,
		activeYear: number,
		config: THeatmapConfig,
		locale: TLocale,
	) {
		const header = root.createDiv({ cls: "persian-heatmap__header" });

		const titleGroup = header.createDiv({ cls: "persian-heatmap__title-group" });
		const yearText = formatNumber(activeYear, locale);
		const titleText = config.title ?? t("heatmap.titleDefault").replace("{year}", yearText);
		titleGroup.createDiv({ cls: "persian-heatmap__title", text: titleText });

		const metricLabel =
			config.metric === "property" && config.property
				? config.property
				: t(`heatmap.metrics.${config.metric}`);
		titleGroup.createSpan({ cls: "persian-heatmap__metric-badge", text: metricLabel });

		const nav = header.createDiv({ cls: "persian-heatmap__nav" });

		const prevBtn = nav.createEl("button", {
			cls: "persian-heatmap__nav-btn",
			attr: {
				type: "button",
				"aria-label": t("heatmap.nav.prevYear"),
				title: t("heatmap.nav.prevYear"),
			},
		});
		setIcon(prevBtn, locale === "fa" ? "chevron-right" : "chevron-left");
		prevBtn.onclick = () => {
			this.currentYear = activeYear - 1;
			void this.render();
		};

		nav.createSpan({ cls: "persian-heatmap__year-label", text: yearText });

		const nextBtn = nav.createEl("button", {
			cls: "persian-heatmap__nav-btn",
			attr: {
				type: "button",
				"aria-label": t("heatmap.nav.nextYear"),
				title: t("heatmap.nav.nextYear"),
			},
		});
		setIcon(nextBtn, locale === "fa" ? "chevron-left" : "chevron-right");
		nextBtn.onclick = () => {
			this.currentYear = activeYear + 1;
			void this.render();
		};
	}

	private renderGrid(
		root: HTMLElement,
		layout: ReturnType<typeof buildJalaliYearLayout>,
		cells: THeatmapDayCell[],
		config: THeatmapConfig,
		today: TJalali,
		locale: TLocale,
	) {
		const scrollContainer = root.createDiv({ cls: "persian-heatmap__scroll" });
		const wrapper = scrollContainer.createDiv({ cls: "persian-heatmap__graph" });

		if (config.showMonths) {
			const monthsRow = wrapper.createDiv({ cls: "persian-heatmap__months" });
			if (config.showWeekdays) {
				monthsRow.addClass("has-weekdays");
			}
			const monthsTrack = monthsRow.createDiv({ cls: "persian-heatmap__months-track" });
			monthsTrack.style.setProperty("--heatmap-weeks", String(layout.totalWeeks));

			let lastPlacedWeek = -3;
			for (const monthStart of layout.monthStarts) {
				if (monthStart.weekIndex - lastPlacedWeek < 2) continue;
				const labelEl = monthsTrack.createSpan({
					cls: "persian-heatmap__month-label",
					text: JALALI_MONTHS_NAME[locale][monthStart.jm],
				});
				labelEl.style.gridColumnStart = String(monthStart.weekIndex + 1);
				lastPlacedWeek = monthStart.weekIndex;
			}
		}

		const body = wrapper.createDiv({ cls: "persian-heatmap__body" });

		if (config.showWeekdays) {
			const weekdaysCol = body.createDiv({ cls: "persian-heatmap__weekdays" });
			for (let row = 0; row < 7; row++) {
				const label = DISPLAYED_WEEKDAY_ROWS.has(row) ? t(`heatmap.weekdaysShort.${row}`) : "";
				weekdaysCol.createSpan({ cls: "persian-heatmap__weekday-label", text: label });
			}
		}

		const cellsGrid = body.createDiv({ cls: "persian-heatmap__cells" });
		cellsGrid.style.setProperty("--heatmap-weeks", String(layout.totalWeeks));

		for (const cell of cells) {
			const isToday = cell.jy === today.jy && cell.jm === today.jm && cell.jd === today.jd;
			const tooltipText = this.formatCellTooltip(cell, config, locale);

			const cellEl = cellsGrid.createDiv({
				cls: "persian-heatmap__cell",
				attr: {
					role: "button",
					tabindex: "0",
					"aria-label": tooltipText,
					"data-level": String(cell.level),
					"data-has-note": String(cell.hasNote),
					"data-today": String(isToday),
				},
			});

			cellEl.style.gridColumnStart = String(cell.weekIndex + 1);
			cellEl.style.gridRowStart = String(cell.weekdayIndex + 1);

			cellEl.addEventListener("mouseenter", () => {
				this.showTooltip(cellEl, tooltipText);
			});
			cellEl.addEventListener("mouseleave", () => {
				this.hideTooltip();
			});
			cellEl.addEventListener("focus", () => {
				this.showTooltip(cellEl, tooltipText);
			});
			cellEl.addEventListener("blur", () => {
				this.hideTooltip();
			});

			const openCellNote = (openInNewTab: boolean) => {
				void this.plugin.noteService.openOrCreateDailyNote(
					cell.jy,
					cell.jm,
					cell.jd,
					openInNewTab ? "tab" : "current",
				);
			};

			cellEl.addEventListener("click", (evt: MouseEvent) => {
				openCellNote(evt.metaKey || evt.ctrlKey);
			});
			cellEl.addEventListener("keydown", (evt: KeyboardEvent) => {
				if (evt.key === "Enter" || evt.key === " ") {
					evt.preventDefault();
					openCellNote(evt.metaKey || evt.ctrlKey);
				}
			});
		}
	}

	private renderFooter(
		root: HTMLElement,
		summary: THeatmapSummary,
		config: THeatmapConfig,
		locale: TLocale,
	) {
		const footer = root.createDiv({ cls: "persian-heatmap__footer" });

		if (config.showSummary) {
			const stats = footer.createDiv({ cls: "persian-heatmap__summary" });
			stats.createSpan({
				cls: "persian-heatmap__stat",
				text: t("heatmap.summary.activeDays").replace(
					"{count}",
					formatNumber(summary.activeDays, locale),
				),
			});

			if (config.metric === "words") {
				stats.createSpan({
					cls: "persian-heatmap__stat",
					text: t("heatmap.summary.totalWords").replace(
						"{count}",
						formatNumber(summary.total, locale),
					),
				});
			} else if (
				config.metric === "tasks" ||
				config.metric === "tasks-open" ||
				config.metric === "tasks-ratio"
			) {
				stats.createSpan({
					cls: "persian-heatmap__stat",
					text: t("heatmap.summary.tasksSummary")
						.replace("{completed}", formatNumber(summary.totalCompletedTasks, locale))
						.replace("{open}", formatNumber(summary.totalOpenTasks, locale)),
				});
			} else if (config.metric === "property") {
				stats.createSpan({
					cls: "persian-heatmap__stat",
					text: t("heatmap.summary.average").replace(
						"{value}",
						formatNumber(summary.average, locale),
					),
				});
			}

			stats.createSpan({
				cls: "persian-heatmap__stat",
				text: t("heatmap.summary.longestStreak").replace(
					"{count}",
					formatNumber(summary.longestStreak, locale),
				),
			});
		}

		if (config.showLegend) {
			const legend = footer.createDiv({ cls: "persian-heatmap__legend" });
			legend.createSpan({ cls: "persian-heatmap__legend-label", text: t("heatmap.legend.less") });
			for (let level = 0; level <= 4; level++) {
				legend.createDiv({
					cls: "persian-heatmap__cell persian-heatmap__legend-cell",
					attr: { "data-level": String(level) },
				});
			}
			legend.createSpan({ cls: "persian-heatmap__legend-label", text: t("heatmap.legend.more") });
		}
	}

	private formatCellTooltip(
		cell: THeatmapDayCell,
		config: THeatmapConfig,
		locale: TLocale,
	): string {
		const weekdayName = WEEKDAYS_NAME[locale][cell.weekdayIndex + 1];
		const monthName = JALALI_MONTHS_NAME[locale][cell.jm];
		const dayStr = formatNumber(cell.jd, locale);
		const yearStr = formatNumber(cell.jy, locale);
		const dateLabel =
			locale === "fa"
				? `${weekdayName}، ${dayStr} ${monthName} ${yearStr}`
				: `${weekdayName}, ${dayStr} ${monthName} ${yearStr}`;

		if (!cell.hasNote) {
			return `${dateLabel} — ${t("heatmap.tooltip.noNote")}`;
		}

		if (config.metric === "words") {
			return `${dateLabel} — ${t("heatmap.tooltip.words").replace(
				"{count}",
				formatNumber(cell.value ?? 0, locale),
			)}`;
		}

		if (config.metric === "tasks" || config.metric === "tasks-open") {
			return `${dateLabel} — ${t("heatmap.tooltip.tasks")
				.replace("{completed}", formatNumber(cell.completedTasks ?? 0, locale))
				.replace("{open}", formatNumber(cell.openTasks ?? 0, locale))}`;
		}

		if (config.metric === "tasks-ratio") {
			const completed = cell.completedTasks ?? 0;
			const open = cell.openTasks ?? 0;
			const total = completed + open;
			const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
			return `${dateLabel} — ${t("heatmap.tooltip.tasksRatio")
				.replace("{percent}", formatNumber(percent, locale))
				.replace("{completed}", formatNumber(completed, locale))
				.replace("{total}", formatNumber(total, locale))}`;
		}

		const propName = config.property ?? "";
		if (cell.value === null) {
			return `${dateLabel} — ${t("heatmap.tooltip.noProperty").replace("{property}", propName)}`;
		}
		return `${dateLabel} — ${t("heatmap.tooltip.property")
			.replace("{property}", propName)
			.replace("{value}", formatNumber(cell.value, locale))}`;
	}

	private showTooltip(target: HTMLElement, text: string) {
		this.hideTooltip();
		const tooltip = activeDocument.body.createDiv({
			cls: "persian-heatmap__tooltip",
			text,
		});
		tooltip.setAttribute("dir", this.plugin.setting.language === "en" ? "ltr" : "rtl");
		this.tooltipEl = tooltip;

		const rect = target.getBoundingClientRect();
		const tipRect = tooltip.getBoundingClientRect();
		const left = Math.max(
			8,
			Math.min(
				window.innerWidth - tipRect.width - 8,
				rect.left + rect.width / 2 - tipRect.width / 2,
			),
		);
		const top = rect.top - tipRect.height - 6;
		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top < 8 ? rect.bottom + 6 : top}px`;
	}

	private hideTooltip() {
		if (this.tooltipEl) {
			this.tooltipEl.remove();
			this.tooltipEl = null;
		}
	}
}

export default class HeatmapService {
	constructor(private readonly plugin: PersianCalendarPlugin) {}

	register() {
		this.plugin.registerMarkdownCodeBlockProcessor(
			"persian-heatmap",
			(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				ctx.addChild(new HeatmapRenderChild(el, source, this.plugin));
			},
		);
	}
}
