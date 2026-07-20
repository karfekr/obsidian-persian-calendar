import type { SectionRenderer } from "src/types";
import { addHeading, addPath } from "../controls";
import { NOTE_TYPES } from "../noteTypes";

export const renderTemplateSection: SectionRenderer = (ctx, containerEl) => {
	const { app, controller } = ctx;

	addHeading(controller, containerEl, "setting.sections.templates");

	for (const noteType of NOTE_TYPES) {
		addPath(
			app,
			controller,
			containerEl,
			noteType.templateNameKey,
			noteType.templateDescKey,
			noteType.templateKey,
			"md-file",
		);
	}
};
