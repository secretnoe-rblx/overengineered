import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { Control } from "engine/client/gui/Control";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Multi: ConfigControlMultiDefinition;
	}
}

export type ConfigControlMultiDefinition = ConfigControlBaseDefinition & {
	readonly Content: GuiObject;
};

export class ConfigControlMulti<T extends defined> extends ConfigControlBase<ConfigControlMultiDefinition, T> {
	protected readonly content: Control;

	constructor(gui: ConfigControlMultiDefinition, name: string) {
		super(gui, name);
		this.content = this.parent(new Control(gui.Content));
	}
}
