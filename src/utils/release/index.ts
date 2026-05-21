import { RELEASE_NOTES } from "src/constants/releaseNotes";
import type { TReleaseNote } from "src/types";

export function compareVersions(v1: string, v2: string): number {
	const parts1 = v1.split(".").map(Number);
	const parts2 = v2.split(".").map(Number);
	for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
		const n1 = parts1[i] || 0;
		const n2 = parts2[i] || 0;
		if (n1 !== n2) return n1 - n2;
	}
	return 0;
}

export function isReleaseNote(version: string): boolean {
	return RELEASE_NOTES.some((note) => note.version === version);
}

export function getReleaseNotesForVersion(version: string): TReleaseNote[] {
	const note = RELEASE_NOTES.find((n) => n.version === version);
	return note ? [note] : [];
}

export function getReleaseNotesBetweenVersions(
	fromVersion: string,
	toVersion: string,
): TReleaseNote[] {
	return RELEASE_NOTES.filter((note) => {
		return (
			compareVersions(note.version, fromVersion) >= 0 &&
			compareVersions(note.version, toVersion) <= 0
		);
	});
}

export function getLatestReleaseNotes(): TReleaseNote[] {
	return RELEASE_NOTES.length ? [RELEASE_NOTES[0]] : [];
}
