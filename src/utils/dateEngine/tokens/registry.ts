import type { TTokenDefinition } from "../types";

export class TokenRegistry {
	private tokens = new Map<string, TTokenDefinition>();
	private sortedKeysCache: string[] | null = null;

	register(definition: TTokenDefinition): void {
		if (this.tokens.has(definition.token)) {
			throw new Error(`Token "${definition.token}" is already registered.`);
		}

		this.tokens.set(definition.token, definition);
		this.sortedKeysCache = null;
	}

	get(token: string): TTokenDefinition | undefined {
		return this.tokens.get(token);
	}

	has(token: string): boolean {
		return this.tokens.has(token);
	}

	all(): TTokenDefinition[] {
		return Array.from(this.tokens.values());
	}

	sortedByLengthDesc(): string[] {
		if (!this.sortedKeysCache) {
			this.sortedKeysCache = Array.from(this.tokens.keys()).sort((a, b) => b.length - a.length);
		}

		return this.sortedKeysCache;
	}
}
