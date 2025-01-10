import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { Control } from "engine/client/gui/Control";
import type {
	ConfigControlBaseDefinition,
	ConfigControlBaseDefinitionParts,
} from "client/gui/configControls/ConfigControlBase";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Key: ConfigControlKeyDefinition;
	}
}

export type ConfigControlKeyDefinition = ConfigControlBaseDefinition & ConfigControlKeyDefinitionParts;
export type ConfigControlKeyDefinitionParts = ConfigControlBaseDefinitionParts & {
	readonly Control: KeyChooserControlDefinition;
	readonly UnsetControl: GuiButton;
};
export class ConfigControlKey extends ConfigControlBase<
	ConfigControlBaseDefinition,
	KeyCode | undefined,
	ConfigControlKeyDefinitionParts
> {
	constructor(gui: ConfigControlBaseDefinition & ConfigControlKeyDefinitionParts, name: string) {
		super(gui, name, undefined);

		const control = this.parent(new KeyChooserControl(this.parts.Control));
		this._value.connect(control.value);
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));

		this.parent(new Control(this.parts.UnsetControl)).addButtonAction(() => this._value.set(undefined));
	}
}
