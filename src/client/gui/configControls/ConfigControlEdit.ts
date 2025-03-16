import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { Control } from "engine/client/gui/Control";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Edit: ConfigControlEditDefinition;
	}
}

export type ConfigControlEditDefinition = ConfigControlBaseDefinition & {
	readonly Buttons: GuiObject & {
		readonly EditControl: GuiButton;
		readonly Preview: TextBox;
	};
};
export abstract class ConfigControlEdit<T extends defined> extends ConfigControlBase<ConfigControlEditDefinition, T> {
	constructor(gui: ConfigControlEditDefinition, name: string, open: () => void) {
		super(gui, name);

		this.parent(new Control(gui.Buttons.EditControl)) //
			.addButtonAction(open);
	}
}
