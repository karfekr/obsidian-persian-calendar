import { isCustomEventColor } from "src/constants/customEventColors";
import type { TCustomEvent, TDateFormat, THijriBase, TVaultEventSource } from "src/types";
import { gregorianMonthLength, hijriMonthLength, jalaliMonthLength } from "src/utils/dateUtils";

type TParsedRecurringDate = Pick<TCustomEvent, "calendar" | "month" | "day" | "originYear">;

const DATE_RE = /^(?:([0-9]{4})-)?([0-9]{2})-([0-9]{2})$/;
const FRONTMATTER_BLOCK_RE = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function parseRecurringDate(
	raw: string,
	calendar: TDateFormat = "jalali",
	hijriBase: THijriBase = "iran",
): TParsedRecurringDate | null {
	const match = DATE_RE.exec(raw.trim());
	if (!match) return null;

	const [, yearPart, monthPart, dayPart] = match;
	const originYear = yearPart === undefined ? undefined : Number(yearPart);
	const month = Number(monthPart);
	const day = Number(dayPart);
	if (originYear === 0 || month < 1 || month > 12 || day < 1) return null;

	try {
		// Yearless dates may recur only in years when the day exists, including leap years.
		let maxDay: number;
		switch (calendar) {
			case "jalali":
				maxDay = jalaliMonthLength(originYear ?? 1399, month);
				break;
			case "gregorian":
				maxDay = gregorianMonthLength(originYear ?? 2000, month);
				break;
			case "hijri":
				maxDay =
					originYear === undefined ? 30 : hijriMonthLength(originYear, month, { base: hijriBase });
				break;
		}
		if (day > maxDay) return null;
	} catch {
		return null;
	}

	return { calendar, month, day, ...(originYear === undefined ? {} : { originYear }) };
}

export function parseVaultEventsNote(
	content: string,
	source: TVaultEventSource,
	hijriBase: THijriBase = "iran",
): TCustomEvent[] {
	if (!source.enabled) return [];

	const lines = content.replace(FRONTMATTER_BLOCK_RE, "").split(/\r?\n/);
	const events: TCustomEvent[] = [];

	lines.forEach((rawLine, lineIndex) => {
		const fields = rawLine.trim().split("|");
		if (fields.length < 2 || fields.length > 4) return;
		const [datePart, title, color, holiday] = fields.map((field) => field.trim());
		if (!title || (color && !isCustomEventColor(color)) || (holiday && holiday !== "تعطیل")) return;

		const date = parseRecurringDate(datePart, source.calendar, hijriBase);
		if (!date) return;

		events.push({
			id: `vault:${source.id}:line:${lineIndex}`,
			...date,
			title,
			...(isCustomEventColor(color) ? { color } : {}),
			isHoliday: holiday === "تعطیل",
			enabled: true,
		});
	});

	return events;
}
