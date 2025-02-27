import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { NumberTextBoxControlNullable } from "client/gui/controls/NumberTextBoxControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Vector3: ConfigControlVector3Definition;
	}
}

export type ConfigControlVector3Definition = ConfigControlBaseDefinition & {
	readonly Buttons: GuiObject & {
		readonly X: NumberTextBoxControlDefinition;
		readonly Y: NumberTextBoxControlDefinition;
		readonly Z: NumberTextBoxControlDefinition;
	};
};
export class ConfigControlVector3 extends ConfigControlBase<ConfigControlVector3Definition, Vector3> {
	constructor(gui: ConfigControlVector3Definition, name: string) {
		super(gui, name);

		const x = this.parent(new NumberTextBoxControlNullable(gui.Buttons.X));
		const y = this.parent(new NumberTextBoxControlNullable(gui.Buttons.Y));
		const z = this.parent(new NumberTextBoxControlNullable(gui.Buttons.Z));

		this.valueChanged(() => {
			x.value.set(this.multiOf(this.multiMap((k, v) => v.X)));
			y.value.set(this.multiOf(this.multiMap((k, v) => v.Y)));
			z.value.set(this.multiOf(this.multiMap((k, v) => v.Z)));
		});

		this.event.subscribe(x.submitted, (x) => this.submit(this.multiMap((k, v) => v.with(x, undefined, undefined))));
		this.event.subscribe(y.submitted, (y) => this.submit(this.multiMap((k, v) => v.with(undefined, y, undefined))));
		this.event.subscribe(z.submitted, (z) => this.submit(this.multiMap((k, v) => v.with(undefined, undefined, z))));
	}
}
