import { ColorChooser } from "client/gui/ColorChooser";
import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Colors } from "shared/Colors";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Color: ConfigControlColorDefinition;
	}
}

export type ConfigControlColorDefinition = ConfigControlBaseDefinition & {
	readonly Control: ColorChooserDefinition;
};
export class ConfigControlColor extends ConfigControlBase<ConfigControlColorDefinition, Color3> {
	readonly alpha;

	constructor(gui: ConfigControlColorDefinition, name: string, Alpha = false) {
		super(gui, name, Colors.white);

		this.alpha = new SubmittableValue(new ObservableValue(1));

		const control = this.parent(new ColorChooser(gui.Control, undefined, Alpha));
		this._value.connect(control.value.value);
		this.alpha.value.connect(control.alpha.value);
		this.event.subscribe(control.value.submitted, (value) => this._v.submit(value));
		this.event.subscribe(control.alpha.submitted, (value) => this.alpha.submit(value));
	}
}
