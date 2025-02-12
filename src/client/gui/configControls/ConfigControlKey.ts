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
	KeyCode | "Unknown",
	ConfigControlKeyDefinitionParts
> {
	constructor(gui: ConfigControlBaseDefinition & ConfigControlKeyDefinitionParts, name: string) {
		super(gui, name);

		const control = this.parent(new KeyChooserControl(this.parts.Control));

		this.initFromMultiWithDefault(control.value, () => "Unknown");
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => value)));

		this.parent(new Control(this.parts.UnsetControl)) //
			.addButtonAction(() => this.submit(this.multiMap(() => "Unknown")));
	}
}
