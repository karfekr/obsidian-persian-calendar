import { Notice } from "src/components";
import { t } from "src/languages";
import { DatePatternFormatError } from "src/utils/dateEngine";

export function safeRender(containerEl: HTMLElement, label: string, fn: () => void): boolean {
	try {
		fn();
		return true;
	} catch (error) {
		Notice(`[Persian Calendar] Failed to render ${label}: ${String(error)}`);
		renderCalendarError(containerEl, error);
		return false;
	}
}

function renderCalendarError(containerEl: HTMLElement, error: unknown) {
	const box = containerEl.createDiv({
		cls: "persian-calendar__render-error",
	});

	box.createDiv({
		cls: "persian-calendar__render-error-title",
		text: t("calendarView.renderError.title"),
	});

	if (error instanceof DatePatternFormatError) {
		box.createDiv({
			cls: "persian-calendar__render-error-body",
			text: t("calendarView.renderError.patternBody"),
		});

		box.createDiv({
			cls: "persian-calendar__render-error-line",
			text: `${t("calendarView.renderError.patternLabel")} ${error.pattern}`,
		});

		box.createDiv({
			cls: "persian-calendar__render-error-line",
			text: `${t("calendarView.renderError.tokenLabel")} ${error.token}`,
		});
	} else {
		box.createDiv({
			cls: "persian-calendar__render-error-body",
			text: error instanceof Error ? error.message : String(error),
		});
	}

	box.createDiv({
		cls: "persian-calendar__render-error-hint",
		text: t("calendarView.renderError.hint"),
	});
}
