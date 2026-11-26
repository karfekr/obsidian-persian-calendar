import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import { getGeneralSettings } from "src/templates/Setting/sections/GeneralSection";
import { createSettingChangeHandler } from "src/templates/Setting/settingEffects";
import { describe, expect, it, vi } from "vitest";

describe("in-note navigation setting", () => {
	it("offers the toggle in General settings", () => {
		expect(getGeneralSettings()[0]).toMatchObject({
			type: "group",
			items: expect.arrayContaining([
				{
					name: expect.any(String),
					desc: expect.any(String),
					control: { type: "toggle", key: "showInNoteNavigation" },
				},
			]),
		});
	});

	it("refreshes open notes immediately and saves both toggle states", async () => {
		const setting = { ...DEFAULT_SETTING };
		const refreshAll = vi.fn(() => setting.showInNoteNavigation);
		const savedValues: boolean[] = [];
		const saveSetting = vi.fn(async () => {
			savedValues.push(setting.showInNoteNavigation);
		});
		const plugin = {
			setting,
			noteNavigation: { refreshAll },
			saveSetting,
		} as unknown as PersianCalendarPlugin;
		const changeSetting = createSettingChangeHandler(plugin, vi.fn());

		const disable = changeSetting("showInNoteNavigation", false);
		expect(refreshAll).toHaveLastReturnedWith(false);
		await disable;

		const enable = changeSetting("showInNoteNavigation", true);
		expect(refreshAll).toHaveLastReturnedWith(true);
		await enable;

		expect(savedValues).toEqual([false, true]);
	});
});
