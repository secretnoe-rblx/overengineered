import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import { Objects } from "engine/shared/fixes/Objects";
import type { PlayerSelectorColumnControlDefinition } from "client/gui/controls/PlayerSelectorListControl";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Blacklist: PlayerSettingBlacklistDefinition;
	}
}

export type PlayerSettingBlacklistDefinition = PlayerSettingBaseDefinition & PlayerSelectorColumnControlDefinition;
export class PlayerSettingBlacklist extends PlayerSettingBase<PlayerSettingBlacklistDefinition, readonly number[]> {
	constructor(gui: PlayerSettingBlacklistDefinition, name: string) {
		super(gui, name, Objects.empty);

		const control = this.parent(new PlayerSelectorColumnControl(gui, this._value.get()));
		// this.value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
	}
}
