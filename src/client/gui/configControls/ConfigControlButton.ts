import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { Control } from "engine/client/gui/Control";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Button: ConfigControlButtonDefinition;
	}
}

export type ConfigControlButtonDefinition = ConfigControlBaseDefinition & {
	readonly Control: ToggleControlDefinition;
};
export class ConfigControlButton extends ConfigControlBase<ConfigControlButtonDefinition, never> {
	readonly button;

	constructor(gui: ConfigControlButtonDefinition, name: string, action: () => void) {
		super(gui, name);

		this.button = this.parent(new Control(gui.Control)) //
			.addButtonAction(action);
	}
}
