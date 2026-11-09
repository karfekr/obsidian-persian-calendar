import type { TLocale } from "src/types";
import { toFaNumber } from "src/utils/formatters";

export type TScorpioCalculationMethod = "both" | "constellation" | "sign";

export type TMoonScorpioDayInfo = {
	isScorpio: boolean;
	isAllDay: boolean;
	isEntering: boolean;
	isExiting: boolean;
	entryTime?: string;
	exitTime?: string;
	method: TScorpioCalculationMethod;
	summary: {
		fa: string;
		en: string;
	};
	cautions: {
		fa: string[];
		en: string[];
	};
	recommendations: {
		fa: string[];
		en: string[];
	};
};

const TO_RAD = Math.PI / 180;

function normalizeDeg(deg: number): number {
	return ((deg % 360) + 360) % 360;
}

/**
 * Calculates the Moon's apparent geocentric ecliptic longitude in degrees [0, 360)
 * using the truncated ELP 2000-82 lunar theory (Jean Meeus, Astronomical Algorithms, Ch. 47).
 * High precision across 1900-2150 (sub-arcminute accuracy).
 */
export function getMoonLongitude(date: Date): number {
	const jd = date.getTime() / 86400000 + 2440587.5;
	const T = (jd - 2451545.0) / 36525.0;

	// Fundamental arguments (degrees)
	const Lp = normalizeDeg(
		218.3164477 +
			481267.88123421 * T -
			0.0015786 * T * T +
			(T * T * T) / 538841 -
			(T * T * T * T) / 65194000,
	);
	const D = normalizeDeg(
		297.8501921 +
			445267.1114034 * T -
			0.0018819 * T * T +
			(T * T * T) / 545868 -
			(T * T * T * T) / 113065000,
	);
	const M = normalizeDeg(
		357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000,
	);
	const Mp = normalizeDeg(
		134.9633964 +
			477198.8675055 * T +
			0.0087414 * T * T +
			(T * T * T) / 69699 -
			(T * T * T * T) / 14712000,
	);
	const F = normalizeDeg(
		93.272095 +
			483202.0175233 * T -
			0.0036539 * T * T -
			(T * T * T) / 3526000 +
			(T * T * T * T) / 863310000,
	);

	const E = 1 - 0.002516 * T - 0.0000074 * T * T;

	// Periodic perturbations in longitude (degrees)
	let l = 0;
	l += 6.288774 * Math.sin(Mp * TO_RAD);
	l += 1.274027 * Math.sin((2 * D - Mp) * TO_RAD);
	l += 0.658314 * Math.sin(2 * D * TO_RAD);
	l += 0.213618 * Math.sin(2 * Mp * TO_RAD);
	l -= 0.185116 * Math.sin(M * TO_RAD) * E;
	l -= 0.114332 * Math.sin(2 * F * TO_RAD);
	l += 0.058793 * Math.sin((2 * D - 2 * Mp) * TO_RAD);
	l += 0.057066 * Math.sin((2 * D - M - Mp) * TO_RAD) * E;
	l += 0.053322 * Math.sin((2 * D + Mp) * TO_RAD);
	l += 0.045758 * Math.sin((2 * D - M) * TO_RAD) * E;
	l -= 0.040923 * Math.sin((M - Mp) * TO_RAD) * E;
	l -= 0.03472 * Math.sin(D * TO_RAD);
	l -= 0.030383 * Math.sin((M + Mp) * TO_RAD) * E;
	l += 0.015327 * Math.sin((2 * D - 2 * F) * TO_RAD);
	l -= 0.012528 * Math.sin((2 * D + M - Mp) * TO_RAD) * E;
	l += 0.01098 * Math.sin((2 * D + 2 * Mp) * TO_RAD);
	l += 0.010675 * Math.sin((4 * D - Mp) * TO_RAD);
	l += 0.010034 * Math.sin(3 * Mp * TO_RAD);
	l += 0.008548 * Math.sin((4 * D - 2 * Mp) * TO_RAD);
	l -= 0.007888 * Math.sin((2 * D - M + Mp) * TO_RAD) * E;
	l -= 0.006766 * Math.sin((D + Mp) * TO_RAD);
	l -= 0.005163 * Math.sin((D - M) * TO_RAD);
	l += 0.004987 * Math.sin((D + M) * TO_RAD);
	l += 0.004036 * Math.sin((2 * D - M + 2 * Mp) * TO_RAD) * E;
	l += 0.003994 * Math.sin((2 * D - 3 * Mp) * TO_RAD);
	l += 0.003861 * Math.sin(4 * D * TO_RAD);
	l += 0.003665 * Math.sin((2 * D - M - 2 * Mp) * TO_RAD) * E;
	l -= 0.002689 * Math.sin((2 * D - 2 * F + Mp) * TO_RAD);
	l -= 0.002602 * Math.sin((2 * D + 2 * F) * TO_RAD);
	l += 0.00239 * Math.sin((2 * D - Mp) * TO_RAD);
	l -= 0.002348 * Math.sin((D + 2 * Mp) * TO_RAD);
	l += 0.002236 * Math.sin((2 * Mp - 2 * F) * TO_RAD);
	l -= 0.00212 * Math.sin((2 * D + M) * TO_RAD) * E;
	l -= 0.002069 * Math.sin(2 * M * TO_RAD) * E * E;
	l += 0.002048 * Math.sin((2 * D - 2 * M) * TO_RAD) * E * E;
	l -= 0.001777 * Math.sin((4 * D + Mp) * TO_RAD);
	l += 0.001595 * Math.sin(4 * Mp * TO_RAD);
	l += 0.001215 * Math.sin((4 * D - M - Mp) * TO_RAD) * E;
	l -= 0.00111 * Math.sin((M - 2 * Mp) * TO_RAD) * E;
	l -= 0.000892 * Math.sin((2 * D + M + Mp) * TO_RAD) * E;

	// Planetary perturbations (Venus, Jupiter, Earth)
	const A1 = normalizeDeg(119.75 + 131.849 * T);
	const A2 = normalizeDeg(53.09 + 479264.29 * T);
	l += 0.003958 * Math.sin(A1 * TO_RAD);
	l += 0.001962 * Math.sin((Lp - F) * TO_RAD);
	l += 0.000318 * Math.sin(A2 * TO_RAD);

	// Nutation in longitude
	const omega = normalizeDeg(125.04452 - 1934.136261 * T);
	const deltaPsi = -0.004778 * Math.sin(omega * TO_RAD);

	return normalizeDeg(Lp + l + deltaPsi);
}

/**
 * Standard Lahiri (Chitrapaksha) Ayanamsa for converting between tropical and sidereal coordinates.
 */
export function getAyanamsa(date: Date): number {
	const jd = date.getTime() / 86400000 + 2440587.5;
	const T = (jd - 2451545.0) / 36525.0;
	return 23.85709 + 1.396042 * T + 0.000308 * T * T;
}

/**
 * Returns tropical longitude boundaries [startLon, endLon] for the specified method.
 */
export function getMethodBoundaries(
	date: Date,
	method: TScorpioCalculationMethod,
): { startLon: number; endLon: number } {
	const ayanamsa = getAyanamsa(date);
	switch (method) {
		case "sign":
			// Tropical Scorpio: 210° to 240°
			return { startLon: 210.0, endLon: 240.0 };
		case "constellation":
			// Sidereal Scorpius: starts around 210° + ayanamsa (~234.2°), ends at constellation boundary (~267.5°)
			return { startLon: 210.0 + ayanamsa, endLon: 267.5 };
		default:
			// Combined cautionary: From entry to sign (210°) until exit from constellation (~267.5°)
			return { startLon: 210.0, endLon: 267.5 };
	}
}

/**
 * High-precision root finder (binary search) to locate exact time Moon crosses target longitude.
 */
function findCrossing(t1: Date, t2: Date, targetLon: number): Date {
	let low = t1.getTime();
	let high = t2.getTime();

	for (let i = 0; i < 28; i++) {
		const mid = (low + high) / 2;
		const lon = getMoonLongitude(new Date(mid));
		if (lon < targetLon) {
			low = mid;
		} else {
			high = mid;
		}
	}

	return new Date((low + high) / 2);
}

function formatHHMM(date: Date, tzOffsetMinutes = 210): string {
	const localMs = date.getTime() + tzOffsetMinutes * 60 * 1000;
	const localDate = new Date(localMs);
	const hh = String(localDate.getUTCHours()).padStart(2, "0");
	const mm = String(localDate.getUTCMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

const TRADITIONAL_CAUTIONS = {
	fa: [
		"پرهیز از عقد و نکاح (ازدواج)",
		"پرهیز از آغاز مسافرت‌های طولانی و مهم",
		"احتیاط در امضای قراردادها و معاملات اساسی",
		"پرهیز از جراحی‌ها و اقدامات مهم غیرضروری",
		"پرهیز از انعقاد نطفه",
	],
	en: [
		"Avoid marriage ceremonies and wedding contracts",
		"Avoid starting long travels or important journeys",
		"Exercise caution with major business contracts and transactions",
		"Postpone elective/non-urgent surgical procedures",
		"Avoid conception",
	],
};

const TRADITIONAL_RECOMMENDATIONS = {
	fa: [
		"در صورت ضرورت انجام کارها یا سفر، دادن صدقه برای رفع نحوست توصیه می‌شود.",
		"تلاوت آیةالکرسی و ادعیه دفع بلا پیش از آغاز امور مهم.",
	],
	en: [
		"Giving charity (Sadaqah) is traditionally recommended if travel or vital actions cannot be delayed.",
		"Reciting protective prayers (Ayat al-Kursi) before engaging in necessary tasks.",
	],
};

/**
 * Calculates Moon in Scorpio day information for a specific calendar date.
 * Default timezone offset is +210 minutes (Asia/Tehran standard UTC+3:30).
 */
export function getMoonScorpioDayInfo(
	date: Date,
	method: TScorpioCalculationMethod = "both",
	tzOffsetMinutes = 210,
): TMoonScorpioDayInfo {
	// Calculate boundaries of the day (00:00:00 to 23:59:59.999) in target timezone
	const localMs = date.getTime() + tzOffsetMinutes * 60 * 1000;
	const localDate = new Date(localMs);
	const y = localDate.getUTCFullYear();
	const m = localDate.getUTCMonth();
	const d = localDate.getUTCDate();

	const dayStartUtcMs = Date.UTC(y, m, d, 0, 0, 0) - tzOffsetMinutes * 60 * 1000;
	const dayEndUtcMs = Date.UTC(y, m, d, 23, 59, 59, 999) - tzOffsetMinutes * 60 * 1000;

	const tStart = new Date(dayStartUtcMs);
	const tEnd = new Date(dayEndUtcMs);

	const { startLon, endLon } = getMethodBoundaries(tStart, method);

	const lonStart = getMoonLongitude(tStart);
	const lonEnd = getMoonLongitude(tEnd);

	const inScorpioStart = lonStart >= startLon && lonStart < endLon;
	const inScorpioEnd = lonEnd >= startLon && lonEnd < endLon;

	let isEntering = false;
	let isExiting = false;
	let entryTime: string | undefined;
	let exitTime: string | undefined;

	// Check entry crossing
	if (lonStart < startLon && lonEnd >= startLon) {
		isEntering = true;
		const crossDate = findCrossing(tStart, tEnd, startLon);
		entryTime = formatHHMM(crossDate, tzOffsetMinutes);
	}

	// Check exit crossing
	if (lonStart < endLon && lonEnd >= endLon) {
		isExiting = true;
		const crossDate = findCrossing(tStart, tEnd, endLon);
		exitTime = formatHHMM(crossDate, tzOffsetMinutes);
	}

	const isScorpio = inScorpioStart || inScorpioEnd || isEntering || isExiting;
	const isAllDay = inScorpioStart && inScorpioEnd && !isEntering && !isExiting;

	let summaryFa = "";
	let summaryEn = "";

	if (!isScorpio) {
		summaryFa = "امروز قمر در عقرب نیست.";
		summaryEn = "Moon is not in Scorpio today.";
	} else if (isAllDay) {
		summaryFa = "قمر در عقرب (تمام روز)";
		summaryEn = "Moon in Scorpio (All Day)";
	} else if (isEntering && isExiting) {
		summaryFa = `قمر در عقرب: ورود ساعت ${toFaNumber(entryTime ?? "")} | خروج ساعت ${toFaNumber(exitTime ?? "")}`;
		summaryEn = `Moon in Scorpio: Enters at ${entryTime} | Exits at ${exitTime}`;
	} else if (isEntering) {
		summaryFa = `ورود به قمر در عقرب از ساعت ${toFaNumber(entryTime ?? "")}`;
		summaryEn = `Moon enters Scorpio at ${entryTime}`;
	} else if (isExiting) {
		summaryFa = `قمر در عقرب تا ساعت ${toFaNumber(exitTime ?? "")}`;
		summaryEn = `Moon in Scorpio until ${exitTime}`;
	}

	return {
		isScorpio,
		isAllDay,
		isEntering,
		isExiting,
		entryTime,
		exitTime,
		method,
		summary: {
			fa: summaryFa,
			en: summaryEn,
		},
		cautions: TRADITIONAL_CAUTIONS,
		recommendations: TRADITIONAL_RECOMMENDATIONS,
	};
}

/**
 * Returns formatted text description of Moon in Scorpio for templates / daily notes.
 */
export function getMoonScorpioNoteText(
	date: Date,
	method: TScorpioCalculationMethod = "both",
	locale: TLocale = "fa",
	tzOffsetMinutes = 210,
): string {
	const info = getMoonScorpioDayInfo(date, method, tzOffsetMinutes);
	if (!info.isScorpio) {
		return "";
	}
	if (locale === "fa") {
		return `🦂 ${info.summary.fa}`;
	}
	return `🦂 ${info.summary.en}`;
}
