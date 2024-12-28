import { PlayerSettingColor } from "client/gui/playerSettings/controls/PlayerSettingColor";
import { PlayerSettingDivider } from "client/gui/playerSettings/controls/PlayerSettingDivider";
import { PlayerSettingDropdown } from "client/gui/playerSettings/controls/PlayerSettingDropdown";
import { PlayerSettingKey } from "client/gui/playerSettings/controls/PlayerSettingKey";
import { PlayerSettingSlider } from "client/gui/playerSettings/controls/PlayerSettingSlider";
import { PlayerSettingToggle } from "client/gui/playerSettings/controls/PlayerSettingToggle";
import { Control } from "engine/client/gui/Control";
import type { Component } from "engine/shared/component/Component";

export interface PlayerSettingsTemplateList {}
export type PlayerSettingsListDefinition = ScrollingFrame;

const clone = <T extends GuiObject>(instance: T): T => {
	const clone = instance.Clone();
	clone.Visible = true;
	clone.Parent = instance.Parent;

	return clone;
};
type ArgsOfSkip1<T extends ConstructorOf<Component>> =
	T extends ConstructorOf<unknown, infer Args extends unknown[]>
		? Args extends [unknown, ...infer Rest extends unknown[]]
			? Rest
			: []
		: never;

export class PlayerSettingsList extends Control<ScrollingFrame & PlayerSettingsTemplateList> {
	protected addCategory(...args: ArgsOfSkip1<typeof PlayerSettingDivider>) {
		return this.parent(new PlayerSettingDivider(clone(this.gui.Divider), ...args));
	}
	protected addSlider(...args: ArgsOfSkip1<typeof PlayerSettingSlider>) {
		return this.parent(new PlayerSettingSlider(clone(this.gui.Slider), ...args));
	}
	protected addToggle(...args: ArgsOfSkip1<typeof PlayerSettingToggle>) {
		return this.parent(new PlayerSettingToggle(clone(this.gui.Toggle), ...args));
	}
	protected addKey(...args: ArgsOfSkip1<typeof PlayerSettingKey>) {
		return this.parent(new PlayerSettingKey(clone(this.gui.Key), ...args));
	}
	protected addDropdown<T extends string>(...args: ArgsOfSkip1<typeof PlayerSettingDropdown<T>>) {
		return this.parent(new PlayerSettingDropdown(clone(this.gui.Dropdown), ...args));
	}
	protected addColor(...args: ArgsOfSkip1<typeof PlayerSettingColor>) {
		return this.parent(new PlayerSettingColor(clone(this.gui.Color), ...args));
	}
}
