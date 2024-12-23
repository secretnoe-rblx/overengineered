import { Control } from "engine/client/gui/Control";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Divider: PlayerSettingDividerDefinition;
	}
}

export type PlayerSettingDividerDefinition = TextLabel;
export class PlayerSettingDivider extends Control<PlayerSettingDividerDefinition> {
	constructor(gui: PlayerSettingDividerDefinition, text: string) {
		super(gui);
		gui.Text = text;
	}
}
