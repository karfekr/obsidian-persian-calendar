import { Notice as ObsidianNotice } from "obsidian";
import type { TDirection } from "src/types";

export default function Notice(
	message: string,
	direction: TDirection = "ltr",
	timeout?: number,
): ObsidianNotice {
	const notice = new ObsidianNotice(message, timeout);

	const observer = new MutationObserver((_, obs) => {
		const noticeEl = activeDocument.querySelector(".notice");
		if (noticeEl) {
			noticeEl.setAttribute("dir", direction === "rtl" ? "rtl" : "ltr");
			obs.disconnect();
		}
	});

	observer.observe(activeDocument.body, { childList: true, subtree: true });

	return notice;
}
