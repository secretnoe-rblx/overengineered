import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import { Control } from "engine/client/gui/Control";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Key: PlayerSettingKeyDefinition;
	}
}

export type PlayerSettingKeyDefinition = PlayerSettingBaseDefinition & {
	readonly Control: KeyChooserControlDefinition;
	readonly UnsetControl: GuiButton;
};
export class PlayerSettingKey extends PlayerSettingBase<PlayerSettingKeyDefinition, KeyCode | undefined> {
	constructor(gui: PlayerSettingKeyDefinition, name: string) {
		super(gui, name, undefined);

		const control = this.parent(new KeyChooserControl(gui.Control));
		this.value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this.v.submit(value));

		this.parent(new Control(gui.UnsetControl)).addButtonAction(() => this.value.set(undefined));
	}
}
