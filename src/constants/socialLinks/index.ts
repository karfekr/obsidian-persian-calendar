import type { TSocialLink } from "src/types";

export const DEFAULT_SOCIAL_LINKS: TSocialLink[] = [
	{
		href: "https://github.com/maleknejad/obsidian-persian-calendar",
		title: {
			fa: "مستندات پلاگین در Github",
			en: "Plugin documentation on Github",
		},
		icon: "github",
	},
	{
		href: "https://karfekr.ir",
		title: {
			fa: "وبسایت کارفکر",
			en: "Karfekr website",
		},
		icon: "brain",
	},
	{
		href: "https://t.me/karfekr",
		title: {
			fa: "کانال تلگرام کارفکر",
			en: "Karfekr Telegram channel",
		},
		icon: "send",
	},
	{
		href: "https://t.me/ObsidianFarsi",
		title: {
			fa: "جامعه‌ی فارسی ابسیدین",
			en: "Obsidian Farsi community",
		},
		icon: "message-circle",
	},
];
