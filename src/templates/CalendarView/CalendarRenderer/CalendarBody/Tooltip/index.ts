import type { TEventObject, TLocal } from "src/types";

export default class Tooltip {
	private tooltipWrapperSelector = ".persian-calendar--tooltip-wrapper";
	private tooltipSelector = ".persian-calendar__tooltip";
	private offsetX = 10;
	private offsetY = 10;

	private getOrCreateTooltip(local: TLocal): { wrapper: HTMLElement; tooltip: HTMLElement } {
		let wrapper = activeDocument.querySelector(this.tooltipWrapperSelector) as HTMLElement | null;
		let tooltip: HTMLElement | null = null;

		if (!wrapper) {
			wrapper = activeDocument.createElement("div");
			wrapper.className = "persian-calendar persian-calendar--tooltip-wrapper";
			activeDocument.body.appendChild(wrapper);
		}

		const dir = local === "fa" ? "rtl" : "ltr";
		wrapper.setAttribute("dir", dir);

		tooltip = wrapper.querySelector(this.tooltipSelector);
		if (!tooltip) {
			tooltip = activeDocument.createElement("div");
			tooltip.className = "persian-calendar__tooltip";
			wrapper.appendChild(tooltip);
		}

		return { wrapper, tooltip };
	}

	public showTooltip(e: MouseEvent | TouchEvent, events: TEventObject[], local: TLocal) {
		const { tooltip } = this.getOrCreateTooltip(local);

		while (tooltip.firstChild) {
			tooltip.removeChild(tooltip.firstChild);
		}

		for (const event of events) {
			const eventDiv = activeDocument.createElement("div");
			eventDiv.className = "persian-calendar__tooltip-event";
			if (event.isHoliday) {
				eventDiv.classList.add("persian-calendar__day--holiday");
			}
			eventDiv.textContent = event.title[local];
			tooltip.appendChild(eventDiv);
		}

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (
			typeof TouchEvent !== "undefined" &&
			e instanceof TouchEvent &&
			e.touches.length > 0
		) {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;

			window.setTimeout(() => {
				activeDocument.addEventListener("touchstart", () => this.hideTooltip(), { once: true });
			}, 0);
		}

		if (x === undefined || y === undefined) return;

		tooltip.setCssProps({ display: "block", left: "0px", top: "0px" });

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

		tooltip.setCssProps({ left: `${left}px`, top: `${top}px` });
	}

	public hideTooltip() {
		const wrapper = activeDocument.querySelector(this.tooltipWrapperSelector);
		if (!wrapper) return;

		const tooltip = wrapper.querySelector(this.tooltipSelector) as HTMLElement;
		if (tooltip) {
			tooltip.setCssProps({
				display: "none",
			});
		}
	}
}
