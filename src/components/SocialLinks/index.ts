import { setIcon } from "obsidian";
import { DEFAULT_SOCIAL_LINKS } from "src/constants";
import { onLocalChange, t } from "src/languages";

export default function SocialLinks(
	container: HTMLElement,
	options: {
		className?: string;
	} = {},
): HTMLElement {
	const { className = "persian-calendar__social-links" } = options;

	const containerEl = container.createEl("div", { cls: className });

	DEFAULT_SOCIAL_LINKS.forEach((link) => {
		const a = containerEl.createEl("a", {
			href: link.href,
		});

		setIcon(a, link.icon);

		onLocalChange(() => {
			a.title = t(link.title);
		}, true);
	});

	return containerEl;
}
