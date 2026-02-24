import { dateToGregorian, gregorianToDate, gregorianToJalali, jalaliToGregorian } from "..";
import { gregorianToHijri, hijriMonthLength, hijriToGregorian } from "./core";
import type { THijri, THijriBase, TJalali } from "src/types";

//? --- Main ---
export const dateToHijri = (
	date: Date,
	options?: {
		base?: THijriBase;
	},
): THijri => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = dateToGregorian(date);
	return gregorianToHijri(gy, gm, gd, { base });
};

export const hijriToDate = (
	hy: number,
	hm: number,
	hd: number,
	options?: {
		base?: THijriBase;
	},
): Date => {
	const base = options?.base ?? "iran";

	const { gy, gm, gd } = hijriToGregorian(hy, hm, hd, { base });
	return gregorianToDate(gy, gm, gd);
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

export { gregorianToHijri, hijriToGregorian, hijriMonthLength };
