import { ToggleControl } from "client/gui/controls/ToggleControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Toggle: PlayerSettingToggleDefinition;
	}
}

export type PlayerSettingToggleDefinition = PlayerSettingBaseDefinition & {
	readonly Control: ToggleControlDefinition;
};
export class PlayerSettingToggle extends PlayerSettingBase<PlayerSettingToggleDefinition, boolean> {
	constructor(gui: PlayerSettingToggleDefinition, name: string) {
		super(gui, name, false);

		const control = this.parent(new ToggleControl(gui.Control));
		this._value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
	}
}
