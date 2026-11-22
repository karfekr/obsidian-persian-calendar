import { setAdapter } from "persian-holidays";
import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import LiveExpression, {
	LIVE_EXPRESSION_KEYS,
	LIVE_EXPRESSION_PATTERN,
} from "src/services/LiveExpression";
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
	});

	it("exposes one readable, alias-free canonical name for each expression", () => {
		expect(LIVE_EXPRESSION_KEYS).toHaveLength(45);
		expect(LIVE_EXPRESSION_KEYS).toEqual(
			expect.arrayContaining(["ساعت", "شماره ماه", "شماره روز", "مناسبت امروز"]),
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
		["مناسبت امروز", "day"],
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
			const day = "شماره روز";
			const onDay = vi.fn(() => liveExpression.calculateValue(day));
			const unsubscribe = liveExpression.subscribe(liveExpression.getCadence(day), onDay);

			vi.advanceTimersByTime(2100);
			expect(onDay).toHaveReturnedWith("02");

			unsubscribe();
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("expression values", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			// Friday, 1 Farvardin 1404, 12:05:09 in Tehran.
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));
		});

		it("uses padded ASCII date and time components", () => {
			const { liveExpression } = createMockEnv();
			const value = (key: string) => liveExpression.calculateValue(key);

			for (const key of LIVE_EXPRESSION_KEYS) {
				expect(value(key), key).not.toBeNull();
				expect(String(value(key)), key).not.toMatch(/[۰-۹٠-٩]/);
			}

			expect(value("ساعت")).toBe("12");
			expect(value("دقیقه")).toBe("05");
			expect(value("ثانیه")).toBe("09");
			expect(value("شماره ماه")).toBe("01");
			expect(value("شماره روز")).toBe("01");
			expect(value("شماره ماه میلادی")).toBe("03");
			expect(value("شماره روز میلادی")).toBe("21");
			expect(value("شماره ماه قمری")).toMatch(/^\d{2}$/);
			expect(value("شماره روز قمری")).toMatch(/^\d{2}$/);
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

		it.each(["fa", "en"] as const)("normalizes localized output with language %s", (language) => {
			const { plugin, liveExpression } = createMockEnv({ language });
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

			expect(liveExpression.calculateValue("مناسبت امروز")).toEqual(
				expect.stringContaining("رویداد 123"),
			);
		});
	});

	describe("syntax and suggestions", () => {
		it("creates the Live Preview extension from the shared parser", () => {
			const { liveExpression } = createMockEnv();
			expect(liveExpression.createEditorExtension()).toBeDefined();
		});

		it("renders only canonical new syntax in Reading View", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-03-21T08:35:09Z"));

			const { liveExpression } = createMockEnv();
			const document = new FakeDocument();
			const root = new FakeElement(document);
			root.appendChild(new FakeText("اکنون {+ساعت} / {#ساعت}"));
			const addChild = vi.fn();

			liveExpression.handlePostProcess(root as never, { addChild } as never);

			expect(root.childNodes).toHaveLength(3);
			expect((root.childNodes[0] as FakeText).nodeValue).toBe("اکنون ");
			expect((root.childNodes[1] as FakeElement).textContent).toBe("12");
			expect((root.childNodes[2] as FakeText).nodeValue).toBe(" / {#ساعت}");
			expect(addChild).toHaveBeenCalledTimes(1);
		});

		it("matches only the new syntax with Unicode names", () => {
			const source = "{+نام ماه} {+شماره ماه} {#نام_ماه}";
			const pattern = new RegExp(LIVE_EXPRESSION_PATTERN.source, "g");
			expect(Array.from(source.matchAll(pattern), (match) => match[1])).toEqual([
				"نام ماه",
				"شماره ماه",
			]);
			expect("{#نام ماه}".match(new RegExp(LIVE_EXPRESSION_PATTERN.source))).toBeNull();
		});

		it("suggests and inserts exactly the canonical new-syntax expression", () => {
			const { liveExpression } = createMockEnv();
			const provider = liveExpression.toProvider();

			expect("متن {+شماره".match(provider.trigger)?.[0]).toBe("{+شماره");
			expect("متن {#شماره".match(provider.trigger)).toBeNull();
			expect(provider.getSuggestions("شماره ماه")).toContain("{+شماره ماه}");
			expect(provider.getSuggestions("نوروز")).toEqual([]);
			expect(provider.onSelect("{+مناسبت امروز}", {} as never)).toBe("{+مناسبت امروز}");
		});
	});
});
