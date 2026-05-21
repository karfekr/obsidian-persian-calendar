import { Notice as ObsidianNotice } from "obsidian";
import type { TDirection } from "src/types";

export default function Notice(
	message: string,
	direction: TDirection = "ltr",
	timeout?: number,
): ObsidianNotice {
	const notice = new ObsidianNotice(message, timeout);

	const observer = new MutationObserver((mutations, obs) => {
		const noticeEl = document.querySelector(".notice");
		if (noticeEl) {
			noticeEl.setAttribute("dir", direction === "rtl" ? "rtl" : "ltr");
			obs.disconnect();
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });

	return notice;
}
