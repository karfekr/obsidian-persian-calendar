import { PersianCalendar, Time, toCalendarDateTime, toZoned } from "@internationalized/date";
import { checkValidJalali, jalaliToCalendarDate, TEHRAN_TZ } from "src/utils/dateUtils";

import type { Expression, ExpressionContext } from "./registry";

const countdownPattern =
	/^(?:([0-9]{4})-)?([0-9]{2})-([0-9]{2})(?: ([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?)?$/;
const lastYear = new PersianCalendar().getYearsInEra();

function formatDuration(seconds: number, language: ExpressionContext["outputLanguage"]): string {
	const persian = language === "fa";
	if (seconds === 0) return persian ? "اکنون" : "Now";

	const absoluteSeconds = Math.abs(seconds);
	const days = Math.floor(absoluteSeconds / 86400);
	const clock = [
		Math.floor((absoluteSeconds % 86400) / 3600),
		Math.floor((absoluteSeconds % 3600) / 60),
		absoluteSeconds % 60,
	]
		.map((part) => String(part).padStart(2, "0"))
		.join(":");
	const duration = days
		? persian
			? `${days} روز و ${clock}`
			: `${days} ${days === 1 ? "day" : "days"}, ${clock}`
		: clock;
	if (persian) return duration + (seconds > 0 ? " مانده" : " گذشته");
	return duration + (seconds > 0 ? " remaining" : " elapsed");
}

export function parseCountdown(key: string): Expression | undefined {
	const match = countdownPattern.exec(key);
	if (!match) return;
	const [, yearText, monthText, dayText, hour = "0", minute = "0", second = "0"] = match;
	const year = yearText === undefined ? undefined : Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	if (+hour > 23 || +minute > 59 || +second > 59) return;
	if (year !== undefined && (year > lastYear || !checkValidJalali(year, month, day))) return;
	if (year === undefined && (month < 1 || month > 12 || day < 1 || day > (month <= 6 ? 31 : 30)))
		return;

	const time = new Time(+hour, +minute, +second);
	return {
		cadence: "second",
		evaluate(context) {
			const now = Math.floor(context.now.toDate().getTime() / 1000);
			for (let y = year ?? context.jalali.jy; y <= (year ?? lastYear); y++) {
				if (!checkValidJalali(y, month, day)) continue;
				const date = jalaliToCalendarDate(y, month, day);
				const target = toZoned(toCalendarDateTime(date, time), TEHRAN_TZ);
				// Historical clock changes can skip a requested Tehran wall time.
				if (time.compare(target) !== 0) continue;
				const seconds = target.toDate().getTime() / 1000 - now;
				if (year !== undefined || seconds > 0)
					return formatDuration(seconds, context.outputLanguage);
			}
			return null;
		},
	};
}
