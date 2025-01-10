import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { SliderControl } from "client/gui/controls/SliderControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { SliderControlConfig, SliderControlDefinition } from "client/gui/controls/SliderControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Slider: ConfigControlSliderDefinition;
	}
}

export type ConfigControlSliderDefinition = ConfigControlBaseDefinition & {
	readonly Control: SliderControlDefinition;
	readonly ManualControl: TextBox;
};
export class ConfigControlSlider extends ConfigControlBase<ConfigControlSliderDefinition, number> {
	constructor(gui: ConfigControlSliderDefinition, name: string, config: SliderControlConfig) {
		super(gui, name, 0);

		const control = this.parent(new SliderControl(gui.Control, config, { TextBox: gui.ManualControl }));
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
		this._value.connect(control.value);
	}
}
