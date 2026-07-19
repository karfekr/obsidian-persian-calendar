import { defaultTokenRegistry } from "src/utils/dateEngine/tokens";
import { TokenRegistry } from "src/utils/dateEngine/tokens/registry";
import type { TTokenDefinition } from "src/utils/dateEngine/types";

function fakeToken(token: string): TTokenDefinition {
	return {
		token,
		family: "gregorian",
		field: "gy",
		format: () => token,
		regexFragment: () => `(${token})`,
		parseValue: () => 0,
	};
}

describe("TokenRegistry", () => {
	it("registers and retrieves a token by key", () => {
		const registry = new TokenRegistry();
		registry.register(fakeToken("XX"));

		expect(registry.has("XX")).toBe(true);
		expect(registry.get("XX")?.token).toBe("XX");
	});

	it("throws when the same token key is registered twice", () => {
		const registry = new TokenRegistry();
		registry.register(fakeToken("XX"));

		expect(() => registry.register(fakeToken("XX"))).toThrow(/already registered/i);
	});

	it("sorts keys longest-first, recomputing after new registrations", () => {
		const registry = new TokenRegistry();
		registry.register(fakeToken("A"));
		registry.register(fakeToken("AAA"));
		registry.register(fakeToken("AA"));

		expect(registry.sortedByLengthDesc()).toEqual(["AAA", "AA", "A"]);

		registry.register(fakeToken("AAAAA"));
		expect(registry.sortedByLengthDesc()[0]).toBe("AAAAA");
	});

	it("default registry has no duplicate keys across gregorian/jalali sets", () => {
		const keys = defaultTokenRegistry.all().map((t) => t.token);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("default registry includes every token family from the spec", () => {
		const expected = [
			"YYYY",
			"YY",
			"M",
			"MM",
			"MMM",
			"MMMM",
			"D",
			"DD",
			"W",
			"WW",
			"jYYYY",
			"jYY",
			"jM",
			"jMM",
			"jMMM",
			"jMMMM",
			"jD",
			"jDD",
			"jW",
			"jWW",
		];

		for (const token of expected) {
			expect(defaultTokenRegistry.has(token), `expected token "${token}" to be registered`).toBe(
				true,
			);
		}
	});
});
