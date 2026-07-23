import { gregorianTokens } from "./gregorianTokens";
import { jalaliTokens } from "./jalaliTokens";
import { TokenRegistry } from "./registry";

export function createDefaultTokenRegistry(): TokenRegistry {
	const registry = new TokenRegistry();

	for (const definition of [...gregorianTokens, ...jalaliTokens]) {
		registry.register(definition);
	}

	return registry;
}

export const defaultTokenRegistry = createDefaultTokenRegistry();

export { TokenRegistry } from "./registry";
