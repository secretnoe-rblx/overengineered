import { PlayerSettingDivider } from "client/gui/playerSettings/controls/PlayerSettingDivider";
import { PlayerSettingSlider } from "client/gui/playerSettings/controls/PlayerSettingSlider";
import { PlayerSettingToggle } from "client/gui/playerSettings/controls/PlayerSettingToggle";
import { Control } from "engine/client/gui/Control";
import type { SliderControlConfig } from "client/gui/controls/SliderControl";

export interface PlayerSettingsTemplateList {}
export type PlayerSettingsListDefinition = ScrollingFrame;

export class PlayerSettingsList extends Control<ScrollingFrame & PlayerSettingsTemplateList> {
	constructor(gui: ScrollingFrame & PlayerSettingsTemplateList) {
		super(gui);
	}

	private clone<T extends GuiObject>(instance: T): T {
		const clone = instance.Clone();
		clone.Visible = true;
		clone.Parent = instance.Parent;

		return clone;
	}

	protected addCategory(name: string) {
		return this.parent(new PlayerSettingDivider(this.clone(this.gui.Divider), name));
	}
	protected addSlider(name: string, config: SliderControlConfig) {
		return this.parent(new PlayerSettingSlider(this.clone(this.gui.Slider), name, config));
	}
	protected addToggle(name: string) {
		return this.parent(new PlayerSettingToggle(this.clone(this.gui.Toggle), name));
	}
}
