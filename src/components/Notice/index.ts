import { Notice as ObsidianNotice } from "obsidian";
import type { TDirection } from "src/types";

export default function Notice(
	message: string,
	direction: TDirection = "ltr",
	timeout?: number,
): ObsidianNotice {
	const notice = new ObsidianNotice(message, timeout);

	const noticeEl = (notice as any).noticeEl as HTMLElement | undefined;

	if (noticeEl) {
		noticeEl.setAttribute("dir", direction === "rtl" ? "rtl" : "ltr");
	}

	return notice;
}
