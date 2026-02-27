import type { TWeekStart } from "src/types";

export const jalaliTestDates = [
	{ gy: 2024, gm: 3, gd: 20, jy: 1403, jm: 1, jd: 1 },
	{ gy: 2024, gm: 1, gd: 15, jy: 1402, jm: 10, jd: 25 },
	{ gy: 2024, gm: 6, gd: 15, jy: 1403, jm: 3, jd: 26 },
	{ gy: 2024, gm: 12, gd: 31, jy: 1403, jm: 10, jd: 11 },
	{ gy: 2025, gm: 3, gd: 20, jy: 1403, jm: 12, jd: 30 },
];

export const jalaliLeapYearDates = [
	{ jy: 1403, jm: 12, jd: 29 },
	{ jy: 1403, jm: 12, jd: 30 },
];

export const jalaliValidDates = [
	// normal year
	{ jy: 1403, jm: 1, jd: 1, expected: true },
	{ jy: 1403, jm: 6, jd: 15, expected: true },
	{ jy: 1403, jm: 12, jd: 29, expected: true },
	// leap year
	{ jy: 1403, jm: 12, jd: 30, expected: true },
];

export const jalaliInvalidDates = [
	// invalid day
	{ jy: 1403, jm: 6, jd: 0, expected: false },
	// invalid month
	{ jy: 1403, jm: 0, jd: 15, expected: false },
	{ jy: 1403, jm: 13, jd: 15, expected: false },
	{ jy: 1403, jm: 7, jd: 31, expected: false },
	{ jy: 1403, jm: 11, jd: 31, expected: false },
	// invalid years
	{ jy: -1000, jm: 1, jd: 1, expected: false },
	// 30th day in non-leap Esfand
	{ jy: 1401, jm: 12, jd: 30, expected: false },
	{ jy: 1402, jm: 12, jd: 30, expected: false },
	{ jy: 1404, jm: 12, jd: 30, expected: false },
	{ jy: 1405, jm: 12, jd: 30, expected: false },
];

export const gregorianValidDates = [
	{ gy: 2024, gm: 1, gd: 1 },
	{ gy: 2024, gm: 6, gd: 15 },
	{ gy: 2024, gm: 12, gd: 31 },
];

// 365.2422
export const leapYears = [1399, 1403, 1408, 1412];
export const nonLeapYears = [1401, 1402, 1404, 1405];

export const monthCases = [
	...leapYears
		.flatMap((y) => Array.from({ length: 11 }, (_, i) => [y, i + 1, i < 6 ? 31 : 30]))
		.concat(leapYears.map((y) => [y, 12, 30])),
	...nonLeapYears
		.flatMap((y) => Array.from({ length: 11 }, (_, i) => [y, i + 1, i < 6 ? 31 : 30]))
		.concat(nonLeapYears.map((y) => [y, 12, 29])),
];

export const months31 = [1, 2, 3, 4, 5, 6];
export const months30 = [7, 8, 9, 10, 11];

export const weekStarts: TWeekStart[] = ["sat", "sun", "mon"];
