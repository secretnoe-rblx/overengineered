import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Checkbox: ConfigControlCheckboxDefinition;
	}
}

export type ConfigControlCheckboxDefinition = ConfigControlBaseDefinition & {
	readonly Control: CheckBoxControlDefinition;
};
export class ConfigControlCheckbox extends ConfigControlBase<ConfigControlCheckboxDefinition, boolean> {
	constructor(gui: ConfigControlCheckboxDefinition, name: string) {
		super(gui, name);

		const control = this.parent(new CheckBoxControl(gui.Control));

		this.initFromMulti(control.value);
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
