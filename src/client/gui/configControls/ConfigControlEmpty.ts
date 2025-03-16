import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Empty: ConfigControlEmptyDefinition;
	}
}

export type ConfigControlEmptyDefinition = ConfigControlBaseDefinition;
export class ConfigControlEmpty extends ConfigControlBase<ConfigControlEmptyDefinition, never> {
	constructor(gui: ConfigControlEmptyDefinition, name: string) {
		super(gui, name);
	}
}
