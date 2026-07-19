import type PersianCalendarPlugin from "src/main";
import type { TReleaseNote } from "src/types";

export default class VersionChecker {
	constructor(private plugin: PersianCalendarPlugin) {}

	async checkForVersionUpdate() {
		const currentVersion = this.plugin.manifest.version;
		const lastSeenVersion = this.plugin.setting.lastSeenVersion;

		if (!this.plugin.setting.versionUpdate) {
			await this.updateVersionIfChanged(currentVersion, lastSeenVersion);
			return;
		}

		if (!lastSeenVersion) {
			await this.handleFirstRun(currentVersion);
			return;
		}

		if (lastSeenVersion === currentVersion) {
			return;
		}

		await this.handleVersionChange(currentVersion, lastSeenVersion);
	}

	private async updateVersionIfChanged(
		currentVersion: string,
		lastSeenVersion: string | undefined,
	) {
		if (lastSeenVersion !== currentVersion) {
			this.plugin.setting.lastSeenVersion = currentVersion;
			await this.plugin.saveSetting();
		}
	}

	private async handleFirstRun(currentVersion: string) {
		const { getReleaseNotesForVersion, isReleaseNote } = await import("src/utils/release");

		if (!isReleaseNote(currentVersion)) {
			this.plugin.setting.lastSeenVersion = currentVersion;
			await this.plugin.saveSetting();
			return;
		}

		const { UpdateModal } = await import("src/components");
		const releaseNotes = getReleaseNotesForVersion(currentVersion);

		new UpdateModal(this.plugin.app, this.plugin.setting, releaseNotes, () => {
			this.plugin.setting.lastSeenVersion = currentVersion;
			void this.plugin.saveSetting();
		}).open();
	}

	private async handleVersionChange(currentVersion: string, lastSeenVersion: string) {
		const {
			getReleaseNotesBetweenVersions,
			getLatestReleaseNotes,
			compareVersions,
			isReleaseNote,
		} = await import("src/utils/release");

		if (!isReleaseNote(currentVersion)) {
			this.plugin.setting.lastSeenVersion = currentVersion;
			await this.plugin.saveSetting();
			return;
		}

		const { UpdateModal } = await import("src/components");

		let releaseNotes: TReleaseNote[];
		if (compareVersions(currentVersion, lastSeenVersion) > 0) {
			releaseNotes = getReleaseNotesBetweenVersions(lastSeenVersion, currentVersion);
		} else {
			releaseNotes = getLatestReleaseNotes();
		}

		new UpdateModal(this.plugin.app, this.plugin.setting, releaseNotes, () => {
			this.plugin.setting.lastSeenVersion = currentVersion;
			void this.plugin.saveSetting();
		}).open();
	}
}
