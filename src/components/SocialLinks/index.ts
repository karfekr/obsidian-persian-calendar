import { setIcon } from "obsidian";
import { DEFAULT_SOCIAL_LINKS } from "src/constants";
import type { TLocal } from "src/types";

export default function SocialLinks(
	container: HTMLElement,
	local: TLocal,
	options: {
		className?: string;
	} = {},
): HTMLElement {
	const { className = "persian-calendar__social-links" } = options;

	const containerEl = container.createDiv({ cls: className });

	DEFAULT_SOCIAL_LINKS.forEach((link) => {
		const a = containerEl.createEl("a", {
			href: link.href,
			title: link.title[local],
		});
		setIcon(a, link.icon);
	});

	return containerEl;
}
