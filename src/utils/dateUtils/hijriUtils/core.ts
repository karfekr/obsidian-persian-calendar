import {
	CalendarDate,
	IslamicUmalquraCalendar,
	toCalendar,
	GregorianCalendar,
} from "@internationalized/date";
import type { THijri, TGregorian, THijriBase } from "src/types";
import { IRAN_HIJRI_MONTHS, IRAN_HIJRI_ANCHOR } from "src/constants";

const HIJRI_MONTH_MAP = buildHijriMonthMap(IRAN_HIJRI_MONTHS);
function buildHijriMonthMap(raw: Record<number, readonly number[]>) {
	const map = new Map<number, Map<number, 29 | 30>>();

	for (const [yearStr, months] of Object.entries(raw)) {
		const year = Number(yearStr);
		const sub = new Map<number, 29 | 30>();

		months.forEach((len, i) => {
			sub.set(i + 1, len as 29 | 30);
		});

		map.set(year, sub);
	}

	return map;
}

//? Iran conversions
function gregorianToHijriIran(gy: number, gm: number, gd: number): THijri {
	const target = new CalendarDate(gy, gm, gd);

	const anchorG = new CalendarDate(
		IRAN_HIJRI_ANCHOR.gy,
		IRAN_HIJRI_ANCHOR.gm,
		IRAN_HIJRI_ANCHOR.gd,
	);

	let delta = target.compare(anchorG);

	let { hy, hm, hd } = IRAN_HIJRI_ANCHOR;

	while (delta !== 0) {
		const ml = hijriMonthLength(hy, hm);

		if (delta > 0) {
			const remaining = ml - hd;

			if (delta > remaining) {
				delta -= remaining + 1;
				hd = 1;
				hm++;
				if (hm > 12) {
					hm = 1;
					hy++;
				}
			} else {
				hd += delta;
				break;
			}
		} else {
			if (-delta >= hd) {
				delta += hd;
				hm--;
				if (hm < 1) {
					hm = 12;
					hy--;
				}
				hd = hijriMonthLength(hy, hm);
			} else {
				hd += delta;
				break;
			}
		}
	}

	return { hy, hm, hd };
}

function hijriIranToGregorian(hy: number, hm: number, hd: number): TGregorian {
	const anchorG = new CalendarDate(
		IRAN_HIJRI_ANCHOR.gy,
		IRAN_HIJRI_ANCHOR.gm,
		IRAN_HIJRI_ANCHOR.gd,
	);

	let ay = IRAN_HIJRI_ANCHOR.hy;
	let am = IRAN_HIJRI_ANCHOR.hm;
	let ad = IRAN_HIJRI_ANCHOR.hd;

	let delta = 0;

	if (hy > ay || (hy === ay && hm > am) || (hy === ay && hm === am && hd > ad)) {
		while (ay < hy || (ay === hy && am < hm)) {
			delta += hijriMonthLength(ay, am);
			ad = 1;
			am++;
			if (am > 12) {
				am = 1;
				ay++;
			}
		}
		delta += hd - ad;
	} else {
		while (ay > hy || (ay === hy && am > hm)) {
			am--;
			if (am < 1) {
				am = 12;
				ay--;
			}
			delta -= hijriMonthLength(ay, am);
		}
		delta += hd - ad;
	}

	const result = anchorG.add({ days: delta });

	return {
		gy: result.year,
		gm: result.month,
		gd: result.day,
	};
}

//? Umalqura conversions
function gregorianToHijriUmalqura(gy: number, gm: number, gd: number): THijri {
	const g = new CalendarDate(gy, gm, gd);
	const h = toCalendar(g, new IslamicUmalquraCalendar());

	return { hy: h.year, hm: h.month, hd: h.day };
}

function hijriUmalquraToGregorian(hy: number, hm: number, hd: number): TGregorian {
	const h = new CalendarDate(new IslamicUmalquraCalendar(), hy, hm, hd);
	const g = toCalendar(h, new GregorianCalendar());

	return { gy: g.year, gm: g.month, gd: g.day };
}

//? Public Functions
export function hijriMonthLength(hy: number, hm: number, options?: { base?: THijriBase }): number {
	const base = options?.base ?? "iran";

	const iranMonthLength = HIJRI_MONTH_MAP.get(hy)?.get(hm);

	const d = new CalendarDate(new IslamicUmalquraCalendar(), hy, hm, 1);
	const umalquraMonthLength = d.calendar.getDaysInMonth(d);

	return base === "umalqura" ? umalquraMonthLength : (iranMonthLength ?? umalquraMonthLength);
}

export function gregorianToHijri(
	gy: number,
	gm: number,
	gd: number,
	options?: { base?: THijriBase },
): THijri {
	const base = options?.base ?? "iran";

	return base === "umalqura"
		? gregorianToHijriUmalqura(gy, gm, gd)
		: gregorianToHijriIran(gy, gm, gd);
}

export function hijriToGregorian(
	hy: number,
	hm: number,
	hd: number,
	options?: { base?: THijriBase },
): TGregorian {
	const base = options?.base ?? "iran";

	return base === "umalqura"
		? hijriUmalquraToGregorian(hy, hm, hd)
		: hijriIranToGregorian(hy, hm, hd);
}
