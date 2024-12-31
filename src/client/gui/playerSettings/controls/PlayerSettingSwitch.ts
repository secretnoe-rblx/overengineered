import { SwitchControl } from "client/gui/controls/SwitchControl";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import { Objects } from "engine/shared/fixes/Objects";
import type { SwitchControlDefinition, SwitchControlItem } from "client/gui/controls/SwitchControl";
import type { PlayerSettingBaseDefinitionParts } from "client/gui/playerSettings/controls/PlayerSettingBase";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Switch: PlayerSettingSwitchDefinition;
	}
}

export type PlayerSettingSwitchDefinition = GuiObject &
	PlayerSettingSwitchDefinitionParts & {
		readonly Control: SwitchControlDefinition;
	};
export type PlayerSettingSwitchDefinitionParts = PlayerSettingBaseDefinitionParts & {
	readonly ChosenItemDescriptionLabel: TextLabel;
};

export class PlayerSettingSwitch<T extends string> extends PlayerSettingBase<
	PlayerSettingSwitchDefinition,
	T,
	PlayerSettingSwitchDefinitionParts
> {
	constructor(gui: PlayerSettingSwitchDefinition, name: string, items: readonly [key: T, item: SwitchControlItem][]) {
		super(gui, name, items[0][0]);

		const control = this.parent(new SwitchControl<T>(gui.Control, items));
		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
		this._value.connect(control.value);

		if (this.parts.ChosenItemDescriptionLabel) {
			const obj = Objects.fromEntries(items);
			control.value.subscribe((value) => {
				if (obj[value].description === undefined) {
					this.parts.ChosenItemDescriptionLabel.Visible = false;
				} else {
					this.parts.ChosenItemDescriptionLabel.Visible = true;
					this.parts.ChosenItemDescriptionLabel.Text = `${obj[value].name ?? value}: ${obj[value].description}`;
				}
			}, true);
		}
	}
}
