import { Plugin, App, type PluginManifest, WorkspaceLeaf } from "obsidian";
import {
	SmartDateLinker,
	Placeholder,
	NoteService,
	CommandRegistry,
	EventManager,
	VersionChecker,
	ApiService,
	Suggestion,
} from "./services";
import CalendarView from "./templates/CalendarView";
import Setting from "./templates/Setting";
import { DEFAULT_SETTING } from "./constants";
import { dateToJalali, todayTehran } from "./utils/dateUtils";
import type { TSetting } from "./types";
import { onLocalChange, setLocal, t } from "./i18n";
import { DatePicker } from "src/components";

export default class PersianCalendarPlugin extends Plugin {
	// Core properties
	setting: TSetting = DEFAULT_SETTING;
	noteService!: NoteService;
	placeholder: Placeholder;
	dateSuggester?: SmartDateLinker;
	datePicker!: DatePicker;
	api!: ReturnType<ApiService["build"]>;

	// Managers
	commandRegistry!: CommandRegistry;
	eventManager!: EventManager;
	versionChecker!: VersionChecker;

	private apiService!: ApiService;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new Placeholder(this);
	}

	async onload() {
		// Initialize services
		this.initializeServices();

		// Load setting
		await this.loadSetting();

		setLocal(this.setting.language);

		// Initialize api service
		this.apiService = new ApiService();

		// Initialize note service
		this.noteService = new NoteService(this.app, this);

		// Handle startup operations
		this.handleStartup();

		// Register calendar view
		this.registerView("persian-calendar", (leaf) => new CalendarView(leaf, this.app, this));

		// Activate view if not already active
		this.app.workspace.onLayoutReady(async () => {
			if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
				await this.activateView();
			}
		});

		// inject DatePicker button for Jalali
		const observer = new MutationObserver(() => {
			this.injectDatePickerButton(document.body);
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		this.register(() => observer.disconnect());

		// Call parent onload
		super.onload();

		// Register editor suggester
		this.dateSuggester = new SmartDateLinker(this);
		this.registerEditorSuggest(
			new Suggestion(this.app, [this.dateSuggester.toProvider(), this.placeholder.toProvider()]),
		);

		// Register events
		this.eventManager.registerEvents();

		// Register setting tab
		this.addSettingTab(new Setting(this.app, this));

		// Register commands
		this.commandRegistry.registerAllCommands();

		// Check for version updates
		await this.versionChecker.checkForVersionUpdate();

		this.api = this.apiService.build();

		// @ts-ignore
		this.app.plugins.plugins[this.manifest.id].api = this.api;
	}

	private initializeServices() {
		this.commandRegistry = new CommandRegistry(this);
		this.eventManager = new EventManager(this);
		this.versionChecker = new VersionChecker(this);
	}

	private handleStartup() {
		this.app.workspace.onLayoutReady(async () => {
			if (this.setting.openDailyNoteOnStartup) {
				const now = todayTehran();
				const { jy, jm, jd } = dateToJalali(now);
				await this.noteService.openOrCreateDailyNote(jy, jm, jd);
			}
		});
	}

	private injectDatePickerButton(root: HTMLElement) {
		const fields = root.querySelectorAll<HTMLDivElement>(
			'.metadata-property-value[data-property-type="date"]',
		);

		fields.forEach((field) => {
			const existingButton = field.querySelector(".persian-calendar__datepicker-flag");
			if (existingButton) return;

			field.dataset.jalaliInjected = "1";

			const input = field.querySelector<HTMLInputElement>('input[type="date"]');
			if (!input) return;

			field.style.display = "flex";
			field.style.alignItems = "center";
			field.style.gap = "6px";

			const btn = document.createElement("button");
			btn.className = "persian-calendar__datepicker-flag";
			btn.type = "button";

			const refresh = () => {
				btn.title = t("modals.datePicker.tooltip");
			};

			refresh();
			onLocalChange(refresh);

			btn.onclick = () => {
				const val = input.value || null;

				new DatePicker(this.app, this.setting, val, (out) => {
					input.focus();

					input.value = out;

					input.dispatchEvent(
						new InputEvent("input", {
							bubbles: true,
							cancelable: true,
						}),
					);

					input.dispatchEvent(
						new Event("change", {
							bubbles: true,
							cancelable: true,
						}),
					);
				}).open();
			};

			field.appendChild(btn);
		});
	}

	async loadSetting() {
		this.setting = Object.assign({}, DEFAULT_SETTING, await this.loadData());
	}

	async saveSetting() {
		await this.saveData(this.setting);
	}

	async activateView(): Promise<WorkspaceLeaf | null> {
		const existingLeaves = this.app.workspace.getLeavesOfType("persian-calendar");

		if (existingLeaves.length > 0) {
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return existingLeaves[0];
		}

		const rightLeaf = this.app.workspace.getRightLeaf(false);
		if (rightLeaf) {
			await rightLeaf.setViewState({
				type: "persian-calendar",
				active: true,
			});
			return rightLeaf;
		}

		return null;
	}

	refreshViews() {
		const leaves = this.app.workspace.getLeavesOfType("persian-calendar");
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CalendarView) {
				leaf.view.render();
			}
		});
	}

	onunload() {
		this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => leaf.detach());
	}
}
