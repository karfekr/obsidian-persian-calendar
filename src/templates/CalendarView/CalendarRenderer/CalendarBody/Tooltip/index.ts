import { Platform } from "obsidian";
import type { EventType } from "persian-holidays";
import { t } from "src/languages";
import type { TLocale, TMoonScorpioDayInfo } from "src/types";
import { toFaNumber } from "src/utils/formatters";

export default class Tooltip {
	private tooltipWrapperSelector = ".persian-calendar--tooltip-wrapper";
	private tooltipSelector = ".persian-calendar__tooltip";
	private offsetX = 10;
	private offsetY = 10;

	private getOrCreateTooltip(local: TLocale): {
		wrapper: HTMLElement;
		tooltip: HTMLElement;
	} {
		let wrapper = activeDocument.querySelector<HTMLElement>(this.tooltipWrapperSelector);

		if (!wrapper) {
			wrapper = activeDocument.body.createDiv({
				cls: "persian-calendar persian-calendar--tooltip-wrapper",
			});
		}

		const dir = local === "fa" ? "rtl" : "ltr";
		wrapper.setAttribute("dir", dir);

		let tooltip = wrapper.querySelector<HTMLElement>(this.tooltipSelector);

		if (!tooltip) {
			tooltip = wrapper.createDiv({
				cls: "persian-calendar__tooltip",
			});
		}

		return { wrapper, tooltip };
	}

	public showTooltip(
		e: MouseEvent | TouchEvent,
		events: EventType[],
		local: TLocale,
		scorpioInfo?: TMoonScorpioDayInfo,
	): void {
		const { tooltip } = this.getOrCreateTooltip(local);

		tooltip.replaceChildren();

		for (const event of events) {
			const cls = ["persian-calendar__tooltip-event"];

			if (event.isHolidayInIran) {
				cls.push("persian-calendar__day--holiday");
			}

			tooltip.createDiv({
				cls,
				text: event.title[local],
			});
		}

		if (scorpioInfo?.isScorpio) {
			const scorpioEl = tooltip.createDiv({
				cls: "persian-calendar__tooltip-scorpio",
			});

			let timeText = t("scorpioTooltip.allDay");
			if (scorpioInfo.isEntering && scorpioInfo.isExiting) {
				const entry =
					local === "fa" ? toFaNumber(scorpioInfo.entryTime ?? "") : (scorpioInfo.entryTime ?? "");
				const exit =
					local === "fa" ? toFaNumber(scorpioInfo.exitTime ?? "") : (scorpioInfo.exitTime ?? "");
				timeText = t("scorpioTooltip.enteringAndExiting")
					.replace("{entryTime}", entry)
					.replace("{exitTime}", exit);
			} else if (scorpioInfo.isEntering) {
				const entry =
					local === "fa" ? toFaNumber(scorpioInfo.entryTime ?? "") : (scorpioInfo.entryTime ?? "");
				timeText = t("scorpioTooltip.entering").replace("{time}", entry);
			} else if (scorpioInfo.isExiting) {
				const exit =
					local === "fa" ? toFaNumber(scorpioInfo.exitTime ?? "") : (scorpioInfo.exitTime ?? "");
				timeText = t("scorpioTooltip.exiting").replace("{time}", exit);
			}

			scorpioEl.createDiv({
				cls: "persian-calendar__tooltip-scorpio-time",
				text: `🦂 ${timeText}`,
			});
		}

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (Platform.isMobile && e.type === "touchstart") {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;

			const hideOnTouch = () => {
				this.hideTooltip();
			};

			window.setTimeout(() => {
				activeDocument.addEventListener("touchstart", hideOnTouch, {
					once: true,
				});
				activeDocument.addEventListener("touchend", hideOnTouch, {
					once: true,
				});
				activeDocument.addEventListener("touchcancel", hideOnTouch, {
					once: true,
				});
			}, 0);
		}

		if (x === undefined || y === undefined) return;

		tooltip.setCssProps({
			"--persian-calendar-tooltip-left": "0px",
			"--persian-calendar-tooltip-top": "0px",
		});

		tooltip.addClass("is-visible");

		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = tooltip.offsetHeight;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let left = x - tooltipWidth - this.offsetX;

		if (left < 0) {
			left = x + this.offsetX;

			if (left + tooltipWidth > viewportWidth) {
				left = Math.max(0, viewportWidth - tooltipWidth - this.offsetX);
			}
		}

		let top = y + this.offsetY;

		if (top + tooltipHeight > viewportHeight + window.scrollY) {
			top = y - tooltipHeight - this.offsetY;
		}

		tooltip.setCssProps({
			"--persian-calendar-tooltip-left": `${left}px`,
			"--persian-calendar-tooltip-top": `${top}px`,
		});
	}

	public hideTooltip(): void {
		const wrapper = activeDocument.querySelector(this.tooltipWrapperSelector);

		if (!wrapper) return;

		const tooltip = wrapper.querySelector<HTMLElement>(this.tooltipSelector);

		if (!tooltip) return;

		tooltip.removeClass("is-visible");
	}
}
