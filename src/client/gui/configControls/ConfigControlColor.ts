import { Color4Chooser } from "client/gui/Color4Chooser";
import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { Observables } from "engine/shared/event/Observables";
import { Colors } from "shared/Colors";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Color: ConfigControlColorDefinition;
	}
}

export type ConfigControlColorDefinition = ConfigControlBaseDefinition & {
	readonly Control: ColorChooserDefinition;
};
export class ConfigControlColor extends ConfigControlBase<ConfigControlColorDefinition, Color4> {
	constructor(gui: ConfigControlColorDefinition, name: string, alpha = false) {
		super(gui, name);

		const control = this.parent(new Color4Chooser(gui.Control, undefined, alpha));

		this.initFromMultiWithDefault(control.value.value, () => ({ alpha: 1, color: Colors.white }));
		this.event.subscribe(control.value.submitted, (value) => this.submit(this.multiMap(() => value)));
	}

	initColor(
		observable: ObservableValue<object>,
		colorPath: readonly string[],
		transparencyPath: readonly string[],
		updateType: "value" | "submit" = "submit",
	): this {
		const color = this.event.addObservable(
			Observables.createObservableFromObjectProperty<Color3>(observable, colorPath),
		);
		let alpha = this.event.addObservable(
			Observables.createObservableFromObjectProperty<number>(observable, transparencyPath),
		);
		alpha = this.event.addObservable(
			alpha.fCreateBased(
				(c) => 1 - c,
				(c) => 1 - c,
			),
		);

		const stuff = this.event.addObservable(Observables.createObservableFromMultiple({ color, alpha }));

		return this.initToObservable(stuff, updateType);
	}
}
