import type { SectionRenderer } from "src/types";
import { addHeading, addPath } from "../controls";
import { NOTE_TYPES } from "../noteTypes";

export const renderPathSection: SectionRenderer = (ctx, containerEl) => {
	const { app, controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.paths");

	for (const noteType of NOTE_TYPES) {
		addPath(
			app,
			controller,
			containerEl,
			noteType.pathNameKey,
			noteType.pathDescKey,
			noteType.pathKey,
			"folder",
		);
	}
};
