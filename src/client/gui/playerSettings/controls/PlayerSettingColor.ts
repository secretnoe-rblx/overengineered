import { ColorChooser } from "client/gui/ColorChooser";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Colors } from "shared/Colors";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Color: PlayerSettingColorDefinition;
	}
}

export type PlayerSettingColorDefinition = PlayerSettingBaseDefinition & {
	readonly Control: ColorChooserDefinition;
};
export class PlayerSettingColor extends PlayerSettingBase<PlayerSettingColorDefinition, Color3> {
	readonly alpha;

	constructor(gui: PlayerSettingColorDefinition, name: string, Alpha = false) {
		super(gui, name, Colors.white);

		this.alpha = new SubmittableValue(new ObservableValue(1));

		const control = this.parent(new ColorChooser(gui.Control, undefined, Alpha));
		this._value.connect(control.value.value);
		this.alpha.value.connect(control.alpha.value);
		this.event.subscribe(control.value.submitted, (value) => this._v.submit(value));
		this.event.subscribe(control.alpha.submitted, (value) => this.alpha.submit(value));
	}
}
