import {
	CalendarDate,
	createCalendar,
	GregorianCalendar,
	IslamicUmalquraCalendar,
	toCalendar,
} from "@internationalized/date";
import { createIranEstehlal } from "iran-estehlal";
import type { TGregorian, THijri, THijriBase, TJalali } from "src/types";
import { dateToGregorian, gregorianToCalendarDate, gregorianToJalali, jalaliToGregorian } from "..";

const umalqura = createCalendar("islamic-umalqura");

function getUmmAlQuraMonthLength(hy: number, hm: number): 29 | 30 {
	const date = new CalendarDate(umalqura, hy, hm, 1);
	return umalqura.getDaysInMonth(date) as 29 | 30;
}

const iranCalendar = createIranEstehlal(getUmmAlQuraMonthLength);

export function hijriMonthLength(hy: number, hm: number, options?: { base?: THijriBase }): number {
	const base = options?.base ?? "iran";

	if (base === "umalqura") {
		return getUmmAlQuraMonthLength(hy, hm);
	}

	const jalaliMonthLength = iranCalendar.getMonthLength(hy, hm);

	if (!jalaliMonthLength) {
		throw Error("iranCalendar.getMonthLength is null");
	}

	return jalaliMonthLength;
}

export function gregorianToHijri(
	gy: number,
	gm: number,
	gd: number,
	options?: { base?: THijriBase },
): THijri {
	const base = options?.base ?? "iran";

	if (base === "umalqura") {
		const g = new CalendarDate(gy, gm, gd);
		const h = toCalendar(g, new IslamicUmalquraCalendar());

		return {
			hy: h.year,
			hm: h.month,
			hd: h.day,
		};
	}

	const iranHijri = iranCalendar.gregorianToHijri(gy, gm, gd);

	if (!iranHijri) {
		throw Error("iranCalendar.gregorianToHijri is null");
	}

	return iranHijri;
}

export function hijriToGregorian(
	hy: number,
	hm: number,
	hd: number,
	options?: { base?: THijriBase },
): TGregorian {
	const base = options?.base ?? "iran";

	if (base === "umalqura") {
		const h = new CalendarDate(new IslamicUmalquraCalendar(), hy, hm, hd);

		const g = toCalendar(h, new GregorianCalendar());

		return {
			gy: g.year,
			gm: g.month,
			gd: g.day,
		};
	}

	const iranHijri = iranCalendar.hijriToGregorian(hy, hm, hd);

	if (!iranHijri) {
		throw Error("iranCalendar.hijriToGregorian is null");
	}

	return iranHijri;
}

export const dateToHijri = (
	date: CalendarDate,
	options?: {
		base?: THijriBase;
	},
): THijri => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = dateToGregorian(date);
	return gregorianToHijri(gy, gm, gd, { base });
};

export const hijriToCalendarDate = (
	hy: number,
	hm: number,
	hd: number,
	options?: {
		base?: THijriBase;
	},
): CalendarDate => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = hijriToGregorian(hy, hm, hd, { base });
	return gregorianToCalendarDate(gy, gm, gd);
};

export const jalaliToHijri = (
	jy: number,
	jm: number,
	jd: number,
	options?: {
		base?: THijriBase;
	},
): THijri => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	return gregorianToHijri(gy, gm, gd, { base });
};

export const hijriToJalali = (
	hy: number,
	hm: number,
	hd: number,
	options?: {
		base?: THijriBase;
	},
): TJalali => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = hijriToGregorian(hy, hm, hd, { base });
	return gregorianToJalali(gy, gm, gd);
};
