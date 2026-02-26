import { App, Modal } from "obsidian";
import { JALALI_MONTHS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TDateFormat, TJalali, TSetting } from "src/types";
import {
	gregorianToJalali,
	jalaliToGregorian,
	jalaliMonthLength,
	gregorianToDate,
	dateToJalali,
	todayTehran,
} from "src/utils/dateUtils";
import { extractDayFormat, toDayFormat, toFaNumber } from "src/utils/formatters";

export default class DatePicker extends Modal {
	private setting: TSetting;
	private date: TJalali;
	private onSelect: (val: string) => void;
	private outputMode: TDateFormat;

	constructor(app: App, setting: TSetting, initial: string | null, cb: (val: string) => void) {
		super(app);

		this.setting = setting;
		this.outputMode = "gregorian";

		if (initial) {
			const p = extractDayFormat(initial);
			if (p) {
				if (p.year > 1700) {
					// میلادی ورودی است
					const dt = gregorianToDate(p.year, p.month, p.day);
					if (!Number.isNaN(dt.getTime())) {
						const j = gregorianToJalali(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
						this.date = { jy: j.jy, jm: j.jm, jd: j.jd };
						this.outputMode = "gregorian";
					} else {
						this.date = dateToJalali(todayTehran());
					}
				} else {
					const jm = Math.min(Math.max(1, p.month), 12);
					const maxd = jalaliMonthLength(p.year, jm);
					const jd = Math.min(Math.max(1, p.day), maxd);
					this.date = { jy: p.year, jm, jd };
					this.outputMode = "jalali";
				}
			} else {
				this.date = dateToJalali(todayTehran());
				this.outputMode = "gregorian";
			}
		} else {
			this.date = dateToJalali(todayTehran());
			this.outputMode = "gregorian";
		}

		this.onSelect = cb;
	}

	onOpen() {
		this.containerEl.addClass("persian-modal-custom");
		this.render();
	}

	private getMonthName(month: number) {
		const lang = (this.setting?.language ?? "fa") as keyof typeof JALALI_MONTHS_NAME;
		return (JALALI_MONTHS_NAME[lang] as any)[month];
	}

	private getWeekdayLetters() {
		const lang = (this.setting?.language ?? "fa") as keyof typeof WEEKDAYS_NAME;
		const map = WEEKDAYS_NAME[lang] as Record<number, string>;
		const letters: string[] = [];
		for (let i = 1; i <= 7; i++) {
			const name = map[i as keyof typeof map] ?? "";
			letters.push(name.charAt(0));
		}
		return letters;
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		const root = contentEl.createDiv({
			cls: "persian-datepicker obsidian-calendar",
			attr: { dir: "rtl" },
		});

		// Header
		const header = root.createDiv({ cls: "header" });
		header.createEl("button", { text: "‹", cls: "cal-btn nav" }).onclick = () =>
			this.shiftMonth(-1);

		header.createSpan({
			text: `${this.getMonthName(this.date.jm)} ${toFaNumber(this.date.jy)}`,
			cls: "month-title",
		});
		header.createEl("button", { text: "›", cls: "cal-btn nav" }).onclick = () => this.shiftMonth(1);

		// Grid
		const grid = root.createDiv({ cls: "grid", attr: { role: "grid" } });
		this.getWeekdayLetters().forEach((w) =>
			grid.createSpan({ text: w, cls: "dow", attr: { role: "columnheader" } }),
		);

		const gFirst = jalaliToGregorian(this.date.jy, this.date.jm, 1);
		const jsDay = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd).getDay();
		const offset = (jsDay + 1) % 7;

		const prev = this.prevMonth(this.date);
		const prevLen = jalaliMonthLength(prev.jy, prev.jm);
		for (let i = offset - 1; i >= 0; i--) {
			const b = grid.createEl("button", { text: toFaNumber(prevLen - i), cls: "day adjacent" });
			b.tabIndex = -1;
			b.disabled = true;
		}

		const dim = jalaliMonthLength(this.date.jy, this.date.jm);
		for (let d = 1; d <= dim; d++) {
			const isSel = d === this.date.jd;
			const today = dateToJalali(todayTehran());
			const isTod = today.jy === this.date.jy && today.jm === this.date.jm && today.jd === d;
			const btn = grid.createEl("button", {
				text: toFaNumber(d),
				cls: `day${isSel ? " selected" : ""}${isTod ? " today" : ""}`,
			});
			btn.onclick = () => this.pickDay(d);
		}

		const filled = offset + dim;
		const trail = (7 - (filled % 7)) % 7;
		for (let d = 1; d <= trail; d++) {
			const b = grid.createEl("button", { text: toFaNumber(d), cls: "day adjacent" });
			b.tabIndex = -1;
			b.disabled = true;
		}

		const jump = root.createDiv({ cls: "jump-row" });
		jump.createSpan({ text: "برو به (مثال: 140302):", cls: "jump-label" });
		const input = jump.createEl("input", {
			type: "text",
			placeholder: "مثال: 140302",
			cls: "jump-input",
			attr: { maxlength: "6", inputmode: "numeric" },
		});
		input.value = `${this.date.jy}${String(this.date.jm).padStart(2, "0")}`;
		const go = jump.createEl("button", { text: "برو", cls: "jump-btn" });
		const doJump = () => {
			const v = (input.value || "").trim();
			if (/^\d{6}$/.test(v)) {
				const jy = +v.slice(0, 4),
					jm = +v.slice(4, 6);
				if (jm >= 1 && jm <= 12) {
					this.date = { jy, jm, jd: 1 };
					this.render();
				}
			}
		};
		go.onclick = doJump;
		input.onkeydown = (e) => {
			if ((e as KeyboardEvent).key === "Enter") doJump();
		};
	}

	private pickDay(d: number) {
		this.date.jd = d;
		const g = jalaliToGregorian(this.date.jy, this.date.jm, d);
		const out =
			this.outputMode === "gregorian"
				? toDayFormat(g.gy, g.gm, g.gd)
				: toDayFormat(this.date.jy, this.date.jm, d);
		this.onSelect(out);
		this.close();
	}

	private shiftMonth(delta: number) {
		let { jy, jm, jd } = this.date;
		jm += delta;
		if (jm < 1) {
			jm = 12;
			jy--;
		}
		if (jm > 12) {
			jm = 1;
			jy++;
		}
		jd = Math.min(jd, jalaliMonthLength(jy, jm));
		this.date = { jy, jm, jd };
		this.render();
	}

	private prevMonth({ jy, jm, jd }: TJalali) {
		jm--;
		if (jm < 1) {
			jm = 12;
			jy--;
		}
		jd = Math.min(jd, jalaliMonthLength(jy, jm));
		return { jy, jm, jd };
	}
}
