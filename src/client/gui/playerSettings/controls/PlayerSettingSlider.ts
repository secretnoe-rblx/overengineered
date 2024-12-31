import { SliderControl } from "client/gui/controls/SliderControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import type { SliderControlConfig, SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Slider: PlayerSettingSliderDefinition;
	}
}

export type PlayerSettingSliderDefinition = PlayerSettingBaseDefinition & {
	readonly Control: SliderControlDefinition;
	readonly ManualControl: TextBox;
};
export class PlayerSettingSlider extends PlayerSettingBase<PlayerSettingSliderDefinition, number> {
	constructor(gui: PlayerSettingSliderDefinition, name: string, config: SliderControlConfig) {
		super(gui, name, 0);

		const control = this.parent(new SliderControl(gui.Control, config, { TextBox: gui.ManualControl }));
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
		this._value.connect(control.value);
	}
}
