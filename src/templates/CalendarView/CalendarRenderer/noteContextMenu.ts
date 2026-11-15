import { Menu } from "obsidian";
import { getDirection, t } from "src/languages";
import type { TOpenNoteMode } from "src/types";

export function openNoteContextMenu(
	event: MouseEvent,
	onOpen: (openMode: TOpenNoteMode) => void,
	onDelete?: () => void,
): void {
	event.preventDefault();
	event.stopPropagation();

	const menu = new Menu();
	menu.setUseNativeMenu(false);
	const menuEl = (menu as Menu & { dom: HTMLElement }).dom;
	menuEl.setAttribute("dir", getDirection());
	menuEl.style.textAlign = "start";

	menu.addItem((item) => {
		item
			.setTitle(t("calendarView.contextMenu.openInNewTab"))
			.setIcon("file-plus")
			.onClick(() => {
				onOpen("tab");
			});
	});

	menu.addItem((item) => {
		item
			.setTitle(t("calendarView.contextMenu.openInHorizontalSplit"))
			.setIcon("separator-horizontal")
			.onClick(() => {
				onOpen("split-horizontal");
			});
	});

	menu.addItem((item) => {
		item
			.setTitle(t("calendarView.contextMenu.openInVerticalSplit"))
			.setIcon("separator-vertical")
			.onClick(() => {
				onOpen("split-vertical");
			});
	});

	if (onDelete) {
		menu.addSeparator();
		menu.addItem((item) => {
			item
				.setTitle(t("calendarView.contextMenu.deleteDailyNote"))
				.setIcon("trash")
				.onClick(() => {
					onDelete();
				});
		});
	}

	menu.showAtMouseEvent(event);
}
