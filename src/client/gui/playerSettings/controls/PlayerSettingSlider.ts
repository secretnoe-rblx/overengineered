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
	readonly SliderControl: SliderControlDefinition;
	readonly ManualControl: TextBox;
};
export class PlayerSettingSlider extends PlayerSettingBase<PlayerSettingSliderDefinition, number> {
	constructor(gui: PlayerSettingSliderDefinition, name: string, config: SliderControlConfig) {
		super(gui, name, 0);

		const slider = this.parent(new SliderControl(gui.SliderControl, config, { TextBox: gui.ManualControl }));
		this.event.subscribe(slider.submitted, (value) => this._submitted.Fire(value));
		this.event.subscribeRegistration(() => this.value.connect(slider.value));
	}
}
