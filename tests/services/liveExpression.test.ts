import type { App } from "obsidian";
import { TFile } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import LiveExpression, {
	createProgressBar,
	LIVE_EXPRESSION_KEYS,
} from "src/services/LiveExpression";
import NoteService from "src/services/NoteService";
import Placeholder from "src/services/Placeholder";
import type { TSetting } from "src/types";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

function createMockEnv(
	settingOverrides: Partial<TSetting> = {},
	activeFilePath: string | null = null,
) {
	const activeFile = activeFilePath
		? Object.assign(new TFile(), {
				path: activeFilePath,
				basename:
					activeFilePath
						.replace(/\.[^/.]+$/, "")
						.split("/")
						.pop() ?? "",
			})
		: null;

	const mockApp = {
		vault: {
			getAbstractFileByPath: (path: string) => {
				if (activeFile && activeFile.path === path) return activeFile;
				return null;
			},
		},
		workspace: {
			getActiveFile: () => activeFile,
		},
	};

	const plugin = {
		app: mockApp,
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
		getAllCustomEvents: () => settingOverrides.customEvents ?? [],
	} as unknown as PersianCalendarPlugin;

	plugin.placeholder = new Placeholder(plugin);
	plugin.noteService = new NoteService(mockApp as unknown as App, plugin);
	const liveExpression = new LiveExpression(plugin);
	plugin.liveExpression = liveExpression;

	return { plugin, liveExpression, activeFile };
}

describe("LiveExpression service", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	describe("createProgressBar", () => {
		it("creates a 10-block progress bar with percentage", () => {
			expect(createProgressBar(0)).toBe("░░░░░░░░░░ 0%");
			expect(createProgressBar(0.4)).toBe("████░░░░░░ 40%");
			expect(createProgressBar(1)).toBe("██████████ 100%");
		});
	});

	describe("sub-second expressions are excluded", () => {
		it("does not expose millisecond or sub-second expressions", () => {
			const { liveExpression } = createMockEnv();
			expect(LIVE_EXPRESSION_KEYS).not.toContain("میلی_ثانیه");
			expect(LIVE_EXPRESSION_KEYS).not.toContain("timestamp");
			expect(liveExpression.calculateValue("میلی_ثانیه")).toBeNull();
			expect(liveExpression.calculateValue("timestamp")).toBeNull();
		});
	});

	describe("per-expression refresh cadence", () => {
		it("classifies expressions into second, minute, and day cadences", () => {
			const { liveExpression } = createMockEnv();

			// Second-level expressions
			expect(liveExpression.getCadence("ساعت")).toBe("second");
			expect(liveExpression.getCadence("زمان_کامل")).toBe("second");
			expect(liveExpression.getCadence("ثانیه")).toBe("second");
			expect(liveExpression.getCadence("timestamp_unix")).toBe("second");

			// Minute-level expressions
			expect(liveExpression.getCadence("زمان_کوتاه")).toBe("minute");
			expect(liveExpression.getCadence("دقیقه")).toBe("minute");
			expect(liveExpression.getCadence("تاریخ_ساعت")).toBe("minute");
			expect(liveExpression.getCadence("پیشرفت_روز")).toBe("minute");
			expect(liveExpression.getCadence("تایمر_روز")).toBe("minute");

			// Day-level expressions
			expect(liveExpression.getCadence("تاریخ")).toBe("day");
			expect(liveExpression.getCadence("پیشرفت_سال")).toBe("day");
			expect(liveExpression.getCadence("تا_نوروز")).toBe("day");
			expect(liveExpression.getCadence("مناسبت")).toBe("day");
			expect(liveExpression.getCadence("تاریخ شمسی جاری")).toBe("day");
		});
	});

	describe("demand-driven timer scheduler", () => {
		it("starts and stops second-cadence timer only while subscribed", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv();
			const onTick = vi.fn();

			expect(liveExpression.getActiveListenerCount()).toBe(0);
			const unsubscribe = liveExpression.subscribe("second", onTick);
			expect(liveExpression.getActiveListenerCount("second")).toBe(1);

			vi.advanceTimersByTime(3000);
			expect(onTick).toHaveBeenCalledTimes(3);

			unsubscribe();
			expect(liveExpression.getActiveListenerCount("second")).toBe(0);

			vi.advanceTimersByTime(5000);
			expect(onTick).toHaveBeenCalledTimes(3);
		});

		it("aligns minute-cadence timer to minute boundary and stops on unsubscribe", () => {
			vi.useFakeTimers();
			// 12:05:45.000 Tehran -> 15 seconds until 12:06:00
			vi.setSystemTime(new Date("2025-03-21T08:35:45Z"));

			const { liveExpression } = createMockEnv();
			const onTick = vi.fn();
			const unsubscribe = liveExpression.subscribe("minute", onTick);

			vi.advanceTimersByTime(14_000);
			expect(onTick).toHaveBeenCalledTimes(0);

			vi.advanceTimersByTime(1_000);
			expect(onTick).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(60_000);
			expect(onTick).toHaveBeenCalledTimes(2);

			unsubscribe();
			vi.advanceTimersByTime(120_000);
			expect(onTick).toHaveBeenCalledTimes(2);
		});

		it("does not poll day-cadence listeners every second or minute", () => {
			vi.useFakeTimers();
			// 12:05:00 Tehran -> ~11h 55m until Tehran midnight
			vi.setSystemTime(new Date("2025-03-21T08:35:00Z"));

			const { liveExpression } = createMockEnv();
			const onTick = vi.fn();
			const unsubscribe = liveExpression.subscribe("day", onTick);

			vi.advanceTimersByTime(60 * 60 * 1000); // 1 hour
			expect(onTick).toHaveBeenCalledTimes(0);

			unsubscribe();
			liveExpression.destroy();
		});
	});

	describe("calculateValue expression evaluation", () => {
		it("evaluates time, date, progress, countdown, and placeholder expressions in Asia/Tehran", () => {
			vi.useFakeTimers();
			// 2025-03-21T08:35:09Z is 2025-03-21 12:05:09 in Asia/Tehran (+03:30)
			// which is Friday, 1 Farvardin 1404 (Nowruz)
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv({
				dateFormat: "jalali",
			});

			expect(liveExpression.calculateValue("ساعت_عدد")).toBe(12);
			expect(liveExpression.calculateValue("ساعت_۲رقم")).toBe("12");
			expect(liveExpression.calculateValue("دقیقه")).toBe(5);
			expect(liveExpression.calculateValue("دقیقه_۲رقم")).toBe("05");
			expect(liveExpression.calculateValue("ثانیه")).toBe(9);
			expect(liveExpression.calculateValue("ثانیه_۲رقم")).toBe("09");
			expect(liveExpression.calculateValue("زمان_کوتاه")).toBe("12:05");
			expect(liveExpression.calculateValue("زمان_کامل")).toBe("12:05:09");

			expect(liveExpression.calculateValue("تاریخ")).toBe("1404/01/01");
			expect(liveExpression.calculateValue("تاریخ_خط_تیره")).toBe("1404-01-01");
			expect(liveExpression.calculateValue("تاریخ_نقطه")).toBe("1404.01.01");
			expect(liveExpression.calculateValue("تاریخ_کامل")).toBe("جمعه 1 فروردین 1404");
			expect(liveExpression.calculateValue("تاریخ_حروفی")).toBe("1 فروردین 1404");
			expect(liveExpression.calculateValue("تاریخ_کوتاه")).toBe("1/1");
			expect(liveExpression.calculateValue("تاریخ_ساعت")).toBe("1404/01/01 - 12:05");

			expect(liveExpression.calculateValue("سال")).toBe(1404);
			expect(liveExpression.calculateValue("سال_میلادی")).toBe(2025);
			expect(liveExpression.calculateValue("سال_کبیسه")).toBe("خیر");
			expect(liveExpression.calculateValue("کل_روز_سال")).toBe(365);
			expect(liveExpression.calculateValue("روز_سال")).toBe(1);
			expect(liveExpression.calculateValue("روز_باقی_سال")).toBe(364);

			expect(liveExpression.calculateValue("ماه")).toBe("فروردین");
			expect(liveExpression.calculateValue("نام_ماه_en")).toBe("Farvardin");
			expect(liveExpression.calculateValue("شماره_ماه_۲رقم")).toBe("01");
			expect(liveExpression.calculateValue("روز_ماه")).toBe(31);
			expect(liveExpression.calculateValue("روز_باقی_ماه")).toBe(30);

			expect(liveExpression.calculateValue("روز")).toBe("جمعه");
			expect(liveExpression.calculateValue("نام_روز_کوتاه")).toBe("ج");
			expect(liveExpression.calculateValue("نام_روز_en")).toBe("Friday");
			expect(liveExpression.calculateValue("شماره_روز_هفته")).toBe(7);
			expect(liveExpression.calculateValue("آخر_هفته")).toBe("بله");
			expect(liveExpression.calculateValue("روز_کاری")).toBe("خیر");

			expect(liveExpression.calculateValue("فصل")).toBe("بهار");
			expect(liveExpression.calculateValue("شماره_فصل")).toBe(1);
			expect(liveExpression.calculateValue("برج")).toBe("حمل");
			expect(liveExpression.calculateValue("برج_فارسی")).toBe("بره");

			expect(liveExpression.calculateValue("تا_نوروز")).toBe(0);
			expect(liveExpression.calculateValue("پیشرفت_هفته")).toBe("██████████ 100%");
			expect(liveExpression.calculateValue("فصل_emoji")).toBe("🌸");
			expect(liveExpression.calculateValue("روز_شب_emoji")).toBe("☀️");
			expect(liveExpression.calculateValue("امضا_تاریخ")).toBe("📅 1 فروردین 1404 | ⏰ 12:05");

			// Existing Placeholder keys also work as live expressions
			expect(liveExpression.calculateValue("تاریخ شمسی جاری")).toBe("1404-01-01");
			expect(liveExpression.calculateValue("روزهای باقیمانده سال")).toBe(364);

			// Unknown key returns null
			expect(liveExpression.calculateValue("تست_نامعتبر")).toBeNull();
		});
	});

	describe("Suggestion provider (raw syntax without HTML span)", () => {
		it("inserts raw {#expression} text instead of HTML span on select", () => {
			const { liveExpression } = createMockEnv({}, "Dashboard.md");
			const provider = liveExpression.toProvider();

			expect("متن {#ساع".match(provider.trigger)?.[0]).toBe("{#ساع");
			expect("متن {{#ساع".match(provider.trigger)).toBeNull();

			const suggestions = provider.getSuggestions("نوروز");
			expect(suggestions).toContain("{#تا_نوروز}");

			const selected = provider.onSelect("{#تا_نوروز}", {} as never);
			expect(selected).toBe("{#تا_نوروز}");
		});
	});
});
