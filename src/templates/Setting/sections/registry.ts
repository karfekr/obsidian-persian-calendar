import type { SectionRenderer } from "src/types";
import { renderEventSection } from "./EventSection";
import { renderExtraCalendarSection } from "./ExtraCalendarSection";
import { renderGeneralSection } from "./GeneralSection";
import { renderHolidaySection } from "./HolidaySection";
import { renderNameSection } from "./NameSection";
import { renderPathSection } from "./PathSection";
import { renderTemplateSection } from "./TemplateSection";

export const SECTION_REGISTRY: SectionRenderer[] = [
	renderGeneralSection,
	renderPathSection,
	renderNameSection,
	renderTemplateSection,
	renderExtraCalendarSection,
	renderHolidaySection,
	renderEventSection,
];
