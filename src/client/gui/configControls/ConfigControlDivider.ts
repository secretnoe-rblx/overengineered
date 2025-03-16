import { Control } from "engine/client/gui/Control";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Divider: ConfigControlDividerDefinition;
	}
}

export type ConfigControlDividerDefinition = TextLabel;
export class ConfigControlDivider extends Control<ConfigControlDividerDefinition> {
	constructor(gui: ConfigControlDividerDefinition, text: string) {
		super(gui);
		gui.Text = text;
	}
}
