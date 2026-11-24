import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING, GREGORIAN_MONTHS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import LiveExpression, {
	LIVE_EXPRESSION_KEYS,
	LIVE_EXPRESSION_PATTERN,
} from "src/services/LiveExpression";
import { LiveExpressionWidget } from "src/services/LiveExpression/livePreviewExtension";
import type { TSetting } from "src/types";
import { setDefaultEventAdapter } from "src/utils/eventUtils/eventAdapter";

beforeAll(() => {
	setAdapter(setDefaultEventAdapter());
});

function createMockEnv(settingOverrides: Partial<TSetting> = {}) {
	const plugin = {
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
		getAllCustomEvents: () => [],
	} as unknown as PersianCalendarPlugin;

	const liveExpression = new LiveExpression(plugin);
	plugin.liveExpression = liveExpression;

	return { plugin, liveExpression };
}

type FakeNode = FakeElement | FakeText;

class FakeText {
	parentElement: FakeElement | null = null;
	parentNode: FakeElement | null = null;

	constructor(public nodeValue: string) {}
}

class FakeFragment {
	children: FakeNode[] = [];

	appendChild(node: FakeNode): FakeNode {
		this.children.push(node);
		return node;
	}
}

class FakeElement {
	childNodes: FakeNode[] = [];
	className = "";
	dataset: Record<string, string> = {};
	parentElement: FakeElement | null = null;
	parentNode: FakeElement | null = null;
	textContent = "";
	readonly tagName = "DIV";
	readonly classList = { contains: (_token: string) => false };

	constructor(readonly ownerDocument: FakeDocument) {}

	appendChild(node: FakeNode): FakeNode {
		node.parentElement = this;
		node.parentNode = this;
		this.childNodes.push(node);
		return node;
	}

	replaceChild(replacement: FakeFragment, previous: FakeNode): void {
		const index = this.childNodes.indexOf(previous);
		for (const node of replacement.children) {
			node.parentElement = this;
			node.parentNode = this;
		}
		this.childNodes.splice(index, 1, ...replacement.children);
	}

	getTextNodes(): FakeText[] {
		return this.childNodes.flatMap((node) =>
			node instanceof FakeText ? [node] : node.getTextNodes(),
		);
	}
}

class FakeDocument {
	createTreeWalker(root: FakeElement) {
		const textNodes = root.getTextNodes();
		let index = 0;
		return { nextNode: () => textNodes[index++] ?? null };
	}

	createDocumentFragment(): FakeFragment {
		return new FakeFragment();
	}

	createTextNode(text: string): FakeText {
		return new FakeText(text);
	}

	createElement(): FakeElement {
		return new FakeElement(this);
	}
}

describe("LiveExpression service", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("exposes one readable, alias-free canonical name for each expression", () => {
		expect(LIVE_EXPRESSION_KEYS).toHaveLength(39);
		expect(LIVE_EXPRESSION_KEYS).toEqual(
			expect.arrayContaining(["ساعت", "شماره ماه شمسی", "روز ماه شمسی", "مناسبت"]),
		);
		expect(LIVE_EXPRESSION_KEYS.every((key) => !key.includes("_") && !key.includes("۲رقم"))).toBe(
			true,
		);
		expect(LIVE_EXPRESSION_KEYS).not.toEqual(
			expect.arrayContaining(["زمان یونیکس", "زمان ۱۲ساعته", "برج", "برج فارسی", "تا نوروز"]),
		);
	});

	it.each([
		["ثانیه", "second"],
		["دقیقه", "minute"],
		["درصد روز", "minute"],
		["سال شمسی", "day"],
		["مناسبت", "day"],
	] as const)("refreshes %s at %s cadence", (key, cadence) => {
		const { liveExpression } = createMockEnv();
		expect(liveExpression.getCadence(key)).toBe(cadence);
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
			vi.advanceTimersByTime(5000);
			expect(onTick).toHaveBeenCalledTimes(3);
		});

		it("aligns minute-cadence timer to a minute boundary and stops on unsubscribe", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:45Z"));

			const { liveExpression } = createMockEnv();
			const onTick = vi.fn();
			const unsubscribe = liveExpression.subscribe("minute", onTick);

			vi.advanceTimersByTime(14_000);
			expect(onTick).not.toHaveBeenCalled();
			vi.advanceTimersByTime(1_000);
			expect(onTick).toHaveBeenCalledTimes(1);

			unsubscribe();
			vi.advanceTimersByTime(60_000);
			expect(onTick).toHaveBeenCalledTimes(1);
		});

		it("updates padded date components on the shared Tehran day tick", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T20:29:58Z"));

			const { liveExpression } = createMockEnv();
			const day = "روز ماه شمسی";
			const onDay = vi.fn(() => liveExpression.calculateValue(day));
			const unsubscribe = liveExpression.subscribe(liveExpression.getCadence(day), onDay);

			vi.advanceTimersByTime(2100);
			expect(onDay).toHaveReturnedWith("02");

			unsubscribe();
			expect(vi.getTimerCount()).toBe(0);
		});

		it("recalculates from the current Tehran time on resume and removes resume listeners", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-20T20:29:58Z"));
			const documentListeners = new Map<string, () => void>();
			const windowListeners = new Map<string, () => void>();
			vi.stubGlobal("document", {
				visibilityState: "visible",
				addEventListener: (name: string, listener: () => void) =>
					documentListeners.set(name, listener),
				removeEventListener: (name: string) => documentListeners.delete(name),
			});
			vi.stubGlobal("window", {
				addEventListener: (name: string, listener: () => void) =>
					windowListeners.set(name, listener),
				removeEventListener: (name: string) => windowListeners.delete(name),
			});

			const { liveExpression } = createMockEnv();
			const onSecond = vi.fn(() => liveExpression.calculateValue("ثانیه"));
			const onMinute = vi.fn(() => liveExpression.calculateValue("دقیقه"));
			const onDay = vi.fn(() => liveExpression.calculateValue("روز ماه شمسی"));
			const unsubscribeSecond = liveExpression.subscribe("second", onSecond);
			const unsubscribeMinute = liveExpression.subscribe("minute", onMinute);
			const unsubscribeDay = liveExpression.subscribe("day", onDay);
			vi.setSystemTime(new Date("2025-03-20T20:30:05Z"));
			documentListeners.get("visibilitychange")?.();

			expect(onSecond).toHaveReturnedWith("05");
			expect(onMinute).toHaveReturnedWith("00");
			expect(onDay).toHaveReturnedWith("01");
			windowListeners.get("focus")?.();
			expect(onSecond).toHaveBeenCalledOnce();
			expect(onMinute).toHaveBeenCalledOnce();
			expect(onDay).toHaveBeenCalledOnce();
			expect(documentListeners).toHaveLength(1);
			expect(windowListeners).toHaveLength(1);

			unsubscribeSecond();
			unsubscribeMinute();
			unsubscribeDay();
			liveExpression.destroy();
			expect(documentListeners).toHaveLength(0);
			expect(windowListeners).toHaveLength(0);
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("expression values", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			// Friday, 1 Farvardin 1404, 12:05:09 in Tehran.
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));
		});

		it("uses padded English date and time components by default", () => {
			const { liveExpression } = createMockEnv();
			const value = (key: string) => liveExpression.calculateValue(key);

			for (const key of LIVE_EXPRESSION_KEYS) {
				expect(value(key), key).not.toBeNull();
				expect(String(value(key)), key).not.toMatch(/[۰-۹٠-٩]/);
			}

			expect(value("ساعت")).toBe("12");
			expect(value("دقیقه")).toBe("05");
			expect(value("ثانیه")).toBe("09");
			expect(value("شماره ماه شمسی")).toBe("01");
			expect(value("روز ماه شمسی")).toBe("01");
			expect(value("شماره ماه میلادی")).toBe("03");
			expect(value("روز ماه میلادی")).toBe("21");
			expect(value("شماره ماه قمری")).toMatch(/^\d{2}$/);
			expect(value("روز ماه قمری")).toMatch(/^\d{2}$/);
		});

		it("accepts only exact canonical names and has no placeholder fallback", () => {
			const { liveExpression } = createMockEnv();

			for (const key of [
				"ساعت عدد",
				"ساعت ۲رقم",
				"دقیقه ۲رقم",
				"زمان ۱۲ساعته",
				"زمان یونیکس",
				"برج",
				"برج فارسی",
				"تا نوروز",
				"تا_نوروز_روز",
				"نام_ماه",
				"مناسبت_امروز",
				"تاریخ شمسی جاری",
			]) {
				expect(liveExpression.calculateValue(key), key).toBeNull();
			}

			expect(liveExpression.calculateValue(" شماره ماه ")).toBeNull();
		});

		it.each([
			["fa", "fa", "فروردین", "مارس", "جمعه", "بله", "۱۴۰۴", "۱۲", "رویداد ۱۲۳"],
			["fa", "en", "فروردین", "مارس", "جمعه", "بله", "1404", "12", "رویداد 123"],
			["en", "fa", "Farvardin", "March", "Friday", "Yes", "۱۴۰۴", "۱۲", "رویداد ۱۲۳"],
			["en", "en", "Farvardin", "March", "Friday", "Yes", "1404", "12", "رویداد 123"],
		] as const)(
			"keeps output text %s and numerals %s independent",
			(outputLanguage, numeralLanguage, month, gregorianMonth, weekday, holiday, year, hour, eventTitle) => {
				const { plugin, liveExpression } = createMockEnv({
					liveExpressionOutputLanguage: outputLanguage,
					liveExpressionNumeralLanguage: numeralLanguage,
				});
				plugin.getAllCustomEvents = () => [
					{
						id: "mixed-digits",
						title: "رویداد ۱۲٣",
						calendar: "jalali",
						month: 1,
						day: 1,
						enabled: true,
						isHoliday: false,
					},
				];

				expect(liveExpression.calculateValue("نام ماه شمسی")).toBe(month);
				expect(liveExpression.calculateValue("نام ماه میلادی")).toBe(gregorianMonth);
				expect(liveExpression.calculateValue("نام روز")).toBe(weekday);
				expect(liveExpression.calculateValue("تعطیل")).toBe(holiday);
				expect(liveExpression.calculateValue("سال شمسی")).toBe(year);
				expect(liveExpression.calculateValue("ساعت")).toBe(hour);
				expect(liveExpression.calculateValue("مناسبت")).toEqual(
					expect.stringContaining(eventTitle),
				);
			},
		);

		it.each(["fa", "en"] as const)(
			"resolves the Gregorian month name from the shared %s data",
			(locale) => {
				const { liveExpression } = createMockEnv({ liveExpressionOutputLanguage: locale });
				expect(liveExpression.calculateValue("نام ماه میلادی")).toBe(
					GREGORIAN_MONTHS_NAME[locale][3],
				);
			},
		);

		it.each([
			["fa", "بدون مناسبت"],
			["en", "No events"],
		] as const)(
			"localizes the empty event value in %s",
			(liveExpressionOutputLanguage, expected) => {
				const { liveExpression } = createMockEnv({
					liveExpressionOutputLanguage,
					showIROfficialEvents: false,
					showIRHistoricalEvents: false,
					showIRAncientEvents: false,
					showShiaEvents: false,
					showSunniEvents: false,
					showGlobalEvents: false,
				});

				expect(liveExpression.calculateValue("مناسبت")).toBe(expected);
			},
		);
	});

	describe("syntax and suggestions", () => {
		it("creates the Live Preview extension from the shared parser", () => {
			const { liveExpression } = createMockEnv();
			expect(liveExpression.createEditorExtension()).toBeDefined();
		});

		it("refreshes a mounted Reading View expression without modifying Markdown", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { plugin, liveExpression } = createMockEnv({
				showIROfficialEvents: false,
				showIRHistoricalEvents: false,
				showIRAncientEvents: false,
				showShiaEvents: false,
				showSunniEvents: false,
				showGlobalEvents: false,
			});
			const document = new FakeDocument();
			const root = new FakeElement(document);
			root.appendChild(new FakeText("اکنون {+مناسبت} / {#مناسبت}"));
			const addChild = vi.fn((child) => child.onload());

			liveExpression.handlePostProcess(root as never, { addChild } as never);

			expect(root.childNodes).toHaveLength(3);
			expect((root.childNodes[0] as FakeText).nodeValue).toBe("اکنون ");
			expect((root.childNodes[1] as FakeElement).textContent).toBe("بدون مناسبت");
			expect((root.childNodes[2] as FakeText).nodeValue).toBe(" / {#مناسبت}");
			expect(addChild).toHaveBeenCalledTimes(1);

			plugin.getAllCustomEvents = () => [
				{
					id: "today",
					title: "جلسه",
					calendar: "jalali",
					month: 1,
					day: 1,
					enabled: true,
					isHoliday: false,
				},
			];
			liveExpression.refresh();
			expect((root.childNodes[1] as FakeElement).textContent).toBe("جلسه");
		});

		it("refreshes a mounted Live Preview widget and cleans up its subscription", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));
			const { plugin, liveExpression } = createMockEnv({
				showIROfficialEvents: false,
				showIRHistoricalEvents: false,
				showIRAncientEvents: false,
				showShiaEvents: false,
				showSunniEvents: false,
				showGlobalEvents: false,
			});
			const span = { className: "", dataset: {}, textContent: "" } as unknown as HTMLElement;
			vi.stubGlobal("document", { createElement: () => span });

			const widget = new LiveExpressionWidget(
				"مناسبت",
				liveExpression.calculateValue("مناسبت") ?? "",
				liveExpression.getCadence("مناسبت"),
				liveExpression,
			);
			widget.toDOM();
			plugin.getAllCustomEvents = () => [
				{
					id: "today",
					title: "جلسه",
					calendar: "jalali",
					month: 1,
					day: 1,
					enabled: true,
					isHoliday: false,
				},
			];
			liveExpression.refresh();
			expect(span.textContent).toBe("جلسه");

			widget.destroy(span);
			expect(liveExpression.getActiveListenerCount()).toBe(0);
		});

		it("matches only the new syntax with Unicode names", () => {
			const source = "{+نام ماه شمسی} {+شماره ماه شمسی} {#نام_ماه}";
			const pattern = new RegExp(LIVE_EXPRESSION_PATTERN.source, "g");
			expect(Array.from(source.matchAll(pattern), (match) => match[1])).toEqual([
				"نام ماه شمسی",
				"شماره ماه شمسی",
			]);
			expect("{#نام ماه}".match(new RegExp(LIVE_EXPRESSION_PATTERN.source))).toBeNull();
		});

		it("suggests and inserts exactly the canonical new-syntax expression", () => {
			const { liveExpression } = createMockEnv();
			const provider = liveExpression.toProvider();

			expect("متن {+شماره".match(provider.trigger)?.[0]).toBe("{+شماره");
			expect("متن {#شماره".match(provider.trigger)).toBeNull();
			expect(provider.getSuggestions("شماره ماه شمسی")).toContain("{+شماره ماه شمسی}");
			expect(provider.getSuggestions("نوروز")).toEqual([]);
			expect(provider.onSelect("{+مناسبت}", {} as never)).toBe("{+مناسبت}");
		});
	});
});
