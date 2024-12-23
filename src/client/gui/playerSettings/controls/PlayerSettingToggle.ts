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
	readonly ToggleControl: ToggleControlDefinition;
};
export class PlayerSettingToggle extends PlayerSettingBase<PlayerSettingToggleDefinition, boolean> {
	constructor(gui: PlayerSettingToggleDefinition, name: string) {
		super(gui, name, false);

		const toggle = this.parent(new ToggleControl(gui.ToggleControl));
		this.event.subscribe(toggle.submitted, (value) => this._submitted.Fire(value));
		this.event.subscribeRegistration(() => this.value.connect(toggle.value));
	}
}
