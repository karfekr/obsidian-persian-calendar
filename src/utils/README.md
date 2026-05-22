> Was a sentence unclear? Instead of ignoring it, make a simple 'edit' and leave your name in the history of this page's improvement.

> چیزی مبهم بود؟ به جای چشم‌پوشی، با یک ویرایش ساده، نام خود را در تاریخچه‌ی بهبود این صفحه ثبت کن.

# Utils Guide

This file is a complete reference for all utility functions in the `utils` folder.

## dateUtils

### 1. Jalali(Solar Hijri) Functions

| Function                      | Input                                  | Output                                          | Description                                                                                           |
| ----------------------------- | -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `checkValidJalali`            | `(jy: number, jm: number, jd: number)` | `boolean`                                       | Checks if a Jalali date is valid (e.g., 1404/12/29 is valid, 1404/12/30 is not)                       |
| `checkKabiseh`                | `(jy: number)`                         | `boolean`                                       | Returns `true` if the Jalali year is a leap year                                                      |
| `dateToJalali`                | `(date: Date)`                         | `{jy, jm, jd}`                                  | Converts a Gregorian `Date` object to a Jalali date                                                   |
| `jalaliToDate`                | `(jy: number, jm: number, jd: number)` | `Date`                                          | Converts a Jalali date to a Gregorian `Date` object (UTC midnight)                                    |
| `jalaliToGregorian`           | `(jy, jm, jd)`                         | `{gy, gm, gd}`                                  | Converts Jalali to Gregorian                                                                          |
| `gregorianToJalali`           | `(gy, gm, gd)`                         | `{jy, jm, jd}`                                  | Converts Gregorian to Jalali                                                                          |
| `jalaliMonthLength`           | `(jy: number, jm: number)`             | `number`                                        | Returns the number of days in a given Jalali month (29–31)                                            |
| `getDaysInJalaliYear`         | `(jy: number)`                         | `number`                                        | Returns the number of days in a Jalali year (365 or 366)                                              |
| `dateToJWeekNumber`           | `(date: Date)`                         | `number`                                        | Returns the Jalali week number (1–53) from a Gregorian `Date`                                         |
| `jalaliToJWeekNumber`         | `(jy, jm, jd)`                         | `number`                                        | Returns the Jalali week number from a Jalali date                                                     |
| `getFirstWeekStartOfJYear`    | `(jy: number)`                         | `{jy, jm, jd}`                                  | Returns the first day of the first week of a Jalali year (first Saturday of the year)                 |
| `jalaliToStartDayOfWeek`      | `({jYear, jWeekNumber})`               | `{jy, jm, jd, gy, gm, gd}`                      | Returns the first day (Saturday) of a given Jalali week                                               |
| `jalaliToEndDayOfWeek`        | `({jYear, jWeekNumber})`               | `{jy, jm, jd, gy, gm, gd}`                      | Returns the last day (Friday) of a given Jalali week                                                  |
| `dateToMonthName`             | `(date: Date)`                         | `string`                                        | Persian name of the Jalali month – e.g., "اسفند" (Esfand)                                             |
| `dateToSeasonName`            | `(date: Date)`                         | `string`                                        | Persian name of the season – "بهار" (Spring), "تابستان" (Summer), "پاییز" (Autumn), "زمستان" (Winter) |
| `dateToDayOfMonth`            | `(date: Date)`                         | `number`                                        | Day of the month (1–31) in the Jalali calendar                                                        |
| `dateToDaysPassedJYear`       | `(date: Date)`                         | `number`                                        | Number of days passed since the start of the Jalali year (0–365)                                      |
| `dateToDaysRemainingJYear`    | `(date: Date)`                         | `number`                                        | Number of days remaining in the Jalali year                                                           |
| `dateToDaysPassedSeason`      | `(date: Date)`                         | `number`                                        | Number of days passed since the start of the current season                                           |
| `dateToDaysRemainingSeason`   | `(date: Date)`                         | `number`                                        | Number of days remaining in the current season                                                        |
| `dateToDaysPassedJMonth`      | `(date: Date)`                         | `number`                                        | Number of days passed since the start of the Jalali month                                             |
| `dateToDaysRemainingJMonth`   | `(date: Date)`                         | `number`                                        | Number of days remaining in the Jalali month                                                          |
| `dateToStartDayOfJMonthDate`  | `(date: Date)`                         | `Date`                                          | `Date` object for the first day of the current Jalali month                                           |
| `dateToEndDayOfJMonthDate`    | `(date: Date)`                         | `Date`                                          | `Date` object for the last day of the current Jalali month                                            |
| `dateToStartDayOfSeasonDate`  | `(date: Date)`                         | `Date`                                          | `Date` object for the first day of the current season                                                 |
| `dateToEndDayOfSeasonDate`    | `(date: Date)`                         | `Date`                                          | `Date` object for the last day of the current season                                                  |
| `jalaliMonthToGregorianRange` | `(jYear: number, jMonth: number)`      | `{ firstDay: {gy,gm,gd}, lastDay: {gy,gm,gd} }` | Returns the Gregorian equivalent (first and last day) of a given Jalali month                         |
| `jalaliMonthToHijriRange`     | `(jYear: number, jMonth: number)`      | `{ firstDay: {gy,gm,gd}, lastDay: {gy,gm,gd} }` | Returns the Hijri equivalent (as Gregorian dates – note the output!) of a given Jalali month          |

### 2. Gregorian Functions

| Function            | Input                                  | Output         | Description                                                                                     |
| ------------------- | -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `gregorianToDate`   | `(gy: number, gm: number, gd: number)` | `Date \| null` | Validates a Gregorian date and converts it to a `Date` object (or `null` if invalid)            |
| `weekStartNumber`   | `("sat" \| "sun" \| "mon")`            | `number`       | Converts a weekday name to its JavaScript weekday number (Saturday = 6, Sunday = 0, Monday = 1) |
| `jalaliMonthName`   | `(jm: number)`                         | `string`       | Persian name of a Jalali month from its number (1–12) – e.g., `jalaliMonthName(12)` → `"اسفند"` |
| `seasonName`        | `(seasonNumber: number)`               | `string`       | Persian name of a season from its number (1–4) – e.g., `seasonName(3)` → `"پاییز"`              |
| `dateToGregorian`   | `(date: Date)`                         | `{gy, gm, gd}` | Extracts Gregorian year, month, day from a `Date` object                                        |
| `dateToWeekdayName` | `(date: Date)`                         | `string`       | Persian name of the weekday (Saturday to Friday)                                                |
| `addDayDate`        | `(date: Date, days: number)`           | `Date`         | Adds (or subtracts) a number of days to/from a date – returns a new `Date` object               |
| `getWeekdayTehran`  | `(date: Date)`                         | `number`       | Returns the weekday number based on the Tehran timezone (0–6, but check: Saturday=6?)           |
| `todayTehran`       | `()`                                   | `Date`         | Returns today’s date based on the Tehran timezone (no manual setup required)                    |

### 3. Hijri(Islamic Lunar) Functions

| Function           | Input                      | Output         | Description                                                   |
| ------------------ | -------------------------- | -------------- | ------------------------------------------------------------- |
| `gregorianToHijri` | `(gy, gm, gd)`             | `{hy, hm, hd}` | Converts a Gregorian date to Hijri (approximate calculations) |
| `hijriToGregorian` | `(hy, hm, hd)`             | `{gy, gm, gd}` | Converts a Hijri date to Gregorian                            |
| `hijriToJalali`    | `(hy, hm, hd)`             | `{jy, jm, jd}` | Converts a Hijri date to Jalali                               |
| `jalaliToHijri`    | `(jy, jm, jd)`             | `{hy, hm, hd}` | Converts a Jalali date to Hijri                               |
| `dateToHijri`      | `(date: Date)`             | `{hy, hm, hd}` | Converts a Gregorian `Date` object to Hijri                   |
| `hijriMonthLength` | `(hy: number, hm: number)` | `number`       | Returns the number of days in a given Hijri month (29 or 30)  |
| `hijriToDate`      | `(hy, hm, hd)`             | `Date`         | Converts a Hijri date to a Gregorian `Date` object            |

## formatters

### 1. formatCreator

Functions for creating standardized string representations of Jalali dates, months, seasons, and
weeks.

| Function         | Input                                                                         | Output   | Description                                                                        |
| ---------------- | ----------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `toDayFormat`    | `(year: number, month: number, day: number, option?: { separator?: string })` | `string` | Formats a Jalali date as `"1404-12-25"`. Optional separator (default `"-"`).       |
| `toMonthFormat`  | `(year: number, month: number, option?: { separator?: string })`              | `string` | Formats year and month as `"1404-12"`. Optional separator (default `"-"`).         |
| `toSeasonFormat` | `(year: number, season: number, option?: { separator?: string })`             | `string` | Formats year and season number as `"1404-S3"`. Optional separator (default `"-"`). |
| `toWeekFormat`   | `(year: number, week: number, option?: { separator?: string })`               | `string` | Formats year and week number as `"1404-W12"`. Optional separator (default `"-"`).  |

### 2. formatExtractor

Functions for parsing and validating formatted strings back into their components.

| Function              | Input              | Output                         | Description                                                              |
| --------------------- | ------------------ | ------------------------------ | ------------------------------------------------------------------------ |
| `extractDayFormat`    | `(format: string)` | `{ year, month, day } \| null` | Extracts year, month, day from a daily pattern like `"1404-12-25"`.      |
| `extractMonthFormat`  | `(format: string)` | `{ year, month } \| null`      | Extracts year and month from a monthly pattern like `"1404-12"`.         |
| `extractSeasonFormat` | `(format: string)` | `{ year, season } \| null`     | Extracts year and season number from a seasonal pattern like `"1404-3"`. |
| `extractWeekFormat`   | `(format: string)` | `{ year, week } \| null`       | Extracts year and week number from a weekly pattern like `"1404-12"`.    |
| `extractYearFormat`   | `(format: string)` | `number \| null`               | Extracts year from a yearly pattern like `"1404"`.                       |
| `isDayFormat`         | `(format: string)` | `boolean`                      | Checks if the string matches the daily pattern (YYYY-MM-DD).             |
| `isMonthFormat`       | `(format: string)` | `boolean`                      | Checks if the string matches the monthly pattern (YYYY-MM).              |
| `isSeasonFormat`      | `(format: string)` | `boolean`                      | Checks if the string matches the seasonal pattern (YYYY-S#).             |
| `isWeekFormat`        | `(format: string)` | `boolean`                      | Checks if the string matches the weekly pattern (YYYY-W##).              |
| `isYearFormat`        | `(format: string)` | `boolean`                      | Checks if the string matches a 4-digit year pattern.                     |

### 3. numberConverter

Functions for converting between Persian, Arabic, and English numeral digits.

| Function     | Input                       | Output   | Description                                                  |
| ------------ | --------------------------- | -------- | ------------------------------------------------------------ |
| `toFaNumber` | `(input: number \| string)` | `string` | Converts English/Arabic digits to Persian digits             |
| `toArNumber` | `(input: number \| string)` | `string` | Converts English/Persian digits to Arabic digits             |
| `toEnNumber` | `(input: string)`           | `string` | Converts Persian/Arabic digits in a string to English digits |
