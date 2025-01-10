import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Toggle: ConfigControlToggleDefinition;
	}
}

export type ConfigControlToggleDefinition = ConfigControlBaseDefinition & {
	readonly Control: ToggleControlDefinition;
};
export class ConfigControlToggle extends ConfigControlBase<ConfigControlToggleDefinition, boolean> {
	constructor(gui: ConfigControlToggleDefinition, name: string) {
		super(gui, name, false);

		const control = this.parent(new ToggleControl(gui.Control));
		this._value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
	}
}
