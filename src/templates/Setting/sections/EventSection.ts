import type { SectionRenderer } from "src/types";
import { addHeading, addToggle } from "../controls";

export const renderEventSection: SectionRenderer = (ctx, containerEl) => {
	const { controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.events");

	addToggle(controller, containerEl, "setting.events.official.name", null, "showIROfficialEvents", {
		refresh: true,
	});

	addToggle(controller, containerEl, "setting.events.global.name", null, "showGlobalEvents", {
		refresh: true,
	});

	addToggle(
		controller,
		containerEl,
		"setting.events.historical.name",
		null,
		"showIRHistoricalEvents",
		{
			refresh: true,
		},
	);

	addToggle(controller, containerEl, "setting.events.ancient.name", null, "showIRAncientEvents", {
		refresh: true,
	});

	addToggle(controller, containerEl, "setting.events.shia.name", null, "showShiaEvents", {
		refresh: true,
	});

	addToggle(controller, containerEl, "setting.events.sunni.name", null, "showSunniEvents", {
		refresh: true,
	});
};
