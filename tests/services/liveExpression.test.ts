import type { App, Editor } from "obsidian";
import { TFile } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import LiveExpression, { createProgressBar, escapeHtml } from "src/services/LiveExpression";
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
			iterateAllLeaves: vi.fn(),
		},
	};

	const plugin = {
		app: mockApp,
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
		registerInterval: vi.fn(),
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

	describe("escapeHtml and createProgressBar", () => {
		it("escapes HTML special characters", () => {
			expect(escapeHtml(`<span class="x">&</span>`)).toBe(
				"&lt;span class=&quot;x&quot;&gt;&amp;&lt;/span&gt;",
			);
		});

		it("creates a 10-block progress bar with percentage", () => {
			expect(createProgressBar(0)).toBe("░░░░░░░░░░ 0%");
			expect(createProgressBar(0.4)).toBe("████░░░░░░ 40%");
			expect(createProgressBar(1)).toBe("██████████ 100%");
		});
	});

	describe("isFileAllowed scope checks (Issue #112)", () => {
		it("disallows all files when mode is 'disabled'", () => {
			const { liveExpression } = createMockEnv({
				liveExpressionsMode: "disabled",
				liveExpressionsDashboardPath: "Dashboard.md",
			});

			expect(liveExpression.isFileAllowed("Dashboard.md")).toBe(false);
			expect(liveExpression.isFileAllowed("Other.md")).toBe(false);
			expect(liveExpression.isFileAllowed(null)).toBe(false);
		});

		it("allows only the configured dashboard file when mode is 'dashboard'", () => {
			const { liveExpression } = createMockEnv({
				liveExpressionsMode: "dashboard",
				liveExpressionsDashboardPath: "Notes/Dashboard.md",
			});

			expect(liveExpression.isFileAllowed("Notes/Dashboard.md")).toBe(true);
			expect(liveExpression.isFileAllowed("Notes/Other.md")).toBe(false);
			expect(liveExpression.isFileAllowed(null)).toBe(false);
		});

		it("allows all files when mode is 'all'", () => {
			const { liveExpression } = createMockEnv({
				liveExpressionsMode: "all",
			});

			expect(liveExpression.isFileAllowed("Notes/Dashboard.md")).toBe(true);
			expect(liveExpression.isFileAllowed("Daily/1404-01-01.md")).toBe(true);
			expect(liveExpression.isFileAllowed(null)).toBe(true);
		});
	});

	describe("calculateValue expression evaluation", () => {
		it("evaluates time, date, progress, countdown, and placeholder expressions in Asia/Tehran", () => {
			vi.useFakeTimers();
			// 2025-03-21T08:35:09Z is 2025-03-21 12:05:09 in Asia/Tehran (+03:30)
			// which is Friday, 1 Farvardin 1404 (Nowruz)
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv({
				liveExpressionsMode: "all",
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

	describe("handleEditorChange and Suggestion provider", () => {
		it("replaces {#expression} with dynamic span when cursor is right after '}' in allowed file", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression, activeFile } = createMockEnv(
				{
					liveExpressionsMode: "dashboard",
					liveExpressionsDashboardPath: "Dashboard.md",
				},
				"Dashboard.md",
			);

			const lineText = "ساعت فعلی: {#زمان_کوتاه}";
			const replaceRange = vi.fn();
			const mockEditor = {
				getCursor: () => ({ line: 0, ch: lineText.length }),
				getLine: () => lineText,
				replaceRange,
			} as unknown as Editor;

			liveExpression.handleEditorChange(mockEditor, activeFile);

			expect(replaceRange).toHaveBeenCalledWith(
				`<span class="persian-dynamic-tag" data-key="زمان_کوتاه">12:05</span>`,
				{ line: 0, ch: "ساعت فعلی: ".length },
				{ line: 0, ch: lineText.length },
			);
		});

		it("does not replace {#expression} when file is not the configured dashboard", () => {
			const { liveExpression, activeFile } = createMockEnv(
				{
					liveExpressionsMode: "dashboard",
					liveExpressionsDashboardPath: "Dashboard.md",
				},
				"OtherNote.md",
			);

			const lineText = "{#زمان_کوتاه}";
			const replaceRange = vi.fn();
			const mockEditor = {
				getCursor: () => ({ line: 0, ch: lineText.length }),
				getLine: () => lineText,
				replaceRange,
			} as unknown as Editor;

			liveExpression.handleEditorChange(mockEditor, activeFile);
			expect(replaceRange).not.toHaveBeenCalled();
		});

		it("provides autocomplete suggestions for {# when file is allowed", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv(
				{
					liveExpressionsMode: "dashboard",
					liveExpressionsDashboardPath: "Dashboard.md",
				},
				"Dashboard.md",
			);

			const provider = liveExpression.toProvider();
			expect("متن {#ساع".match(provider.trigger)?.[0]).toBe("{#ساع");
			expect("متن {{#ساع".match(provider.trigger)).toBeNull();

			const suggestions = provider.getSuggestions("نوروز");
			expect(suggestions).toContain("{#تا_نوروز}");

			const selected = provider.onSelect("{#تا_نوروز}", {} as never);
			expect(selected).toBe(`<span class="persian-dynamic-tag" data-key="تا_نوروز">0</span>`);
		});
	});

	describe("refreshElement DOM updates", () => {
		it("updates matching span.persian-dynamic-tag elements in allowed files", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv({
				liveExpressionsMode: "dashboard",
				liveExpressionsDashboardPath: "Dashboard.md",
			});

			const tag = {
				dataset: { key: "زمان_کوتاه" },
				textContent: "00:00",
			} as unknown as HTMLElement;

			const root = {
				querySelectorAll: () => [tag],
			} as unknown as ParentNode;

			expect(liveExpression.refreshElement(root, "Other.md")).toBe(0);
			expect(tag.textContent).toBe("00:00");

			expect(liveExpression.refreshElement(root, "Dashboard.md")).toBe(1);
			expect(tag.textContent).toBe("12:05");
		});
	});
});
