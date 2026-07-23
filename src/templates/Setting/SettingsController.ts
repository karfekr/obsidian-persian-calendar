import { onLocalChange } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { TSetting } from "src/types";

type Listener<V> = (value: V) => void;

const TEXT_SAVE_DEBOUNCE_MS = 400;

export class SettingsController {
	readonly plugin: PersianCalendarPlugin;

	private readonly listeners = new Map<keyof TSetting, Set<Listener<unknown>>>();
	private readonly localeUnsubscribers: Array<() => void> = [];
	private saveTimeout?: number;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	get<K extends keyof TSetting>(key: K): TSetting[K] {
		return this.plugin.setting[key];
	}

	async set<K extends keyof TSetting>(
		key: K,
		value: TSetting[K],
		opts: { refresh?: boolean; debounce?: boolean } = {},
	): Promise<void> {
		this.plugin.setting[key] = value;
		this.emit(key, value);

		if (opts.debounce) {
			this.scheduleSave(opts.refresh);
			return;
		}

		if (this.saveTimeout) {
			window.clearTimeout(this.saveTimeout);
			this.saveTimeout = undefined;
		}

		await this.plugin.saveSetting();

		if (opts.refresh) {
			this.plugin.refreshViews();
		}
	}

	onChange<K extends keyof TSetting>(key: K, listener: Listener<TSetting[K]>): () => void {
		let set = this.listeners.get(key);

		if (!set) {
			set = new Set();
			this.listeners.set(key, set);
		}

		set.add(listener as Listener<unknown>);

		return () => set?.delete(listener as Listener<unknown>);
	}

	trackLocale(callback: () => void): void {
		this.localeUnsubscribers.push(onLocalChange(callback, true));
	}

	dispose(): void {
		for (const unsubscribe of this.localeUnsubscribers) {
			unsubscribe();
		}

		this.localeUnsubscribers.length = 0;

		if (this.saveTimeout) {
			window.clearTimeout(this.saveTimeout);
			this.saveTimeout = undefined;
		}
	}

	private emit<K extends keyof TSetting>(key: K, value: TSetting[K]): void {
		const set = this.listeners.get(key);

		if (!set) {
			return;
		}

		for (const listener of set) {
			listener(value);
		}
	}

	private scheduleSave(refresh?: boolean): void {
		if (this.saveTimeout) {
			window.clearTimeout(this.saveTimeout);
		}

		this.saveTimeout = window.setTimeout(() => {
			void this.plugin.saveSetting().then(() => {
				if (refresh) {
					this.plugin.refreshViews();
				}
			});
		}, TEXT_SAVE_DEBOUNCE_MS);
	}
}
