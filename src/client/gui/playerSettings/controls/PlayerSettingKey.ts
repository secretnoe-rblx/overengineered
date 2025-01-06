import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import { Control } from "engine/client/gui/Control";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type {
	PlayerSettingBaseDefinition,
	PlayerSettingBaseDefinitionParts,
} from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Key: PlayerSettingKeyDefinition;
	}
}

export type PlayerSettingKeyDefinition = PlayerSettingBaseDefinition & PlayerSettingKeyDefinitionParts;
export type PlayerSettingKeyDefinitionParts = PlayerSettingBaseDefinitionParts & {
	readonly Control: KeyChooserControlDefinition;
	readonly UnsetControl: GuiButton;
};
export class PlayerSettingKey extends PlayerSettingBase<
	PlayerSettingBaseDefinition,
	KeyCode | undefined,
	PlayerSettingKeyDefinitionParts
> {
	constructor(gui: PlayerSettingBaseDefinition & PlayerSettingKeyDefinitionParts, name: string) {
		super(gui, name, undefined);

		const control = this.parent(new KeyChooserControl(this.parts.Control));
		this._value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));

		this.parent(new Control(this.parts.UnsetControl)).addButtonAction(() => this._value.set(undefined));
	}
}
