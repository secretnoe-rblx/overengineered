import { DropdownList } from "client/gui/controls/DropdownList";
import { PlayerSettingBase } from "client/gui/playerSettings/controls/PlayerSettingBase";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { PlayerSettingBaseDefinition } from "client/gui/playerSettings/controls/PlayerSettingBase";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

declare module "client/gui/playerSettings/PlayerSettingsList" {
	export interface PlayerSettingsTemplateList {
		readonly Dropdown: PlayerSettingDropdownDefinition;
	}
}

export type PlayerSettingDropdownDefinition = PlayerSettingBaseDefinition & {
	readonly Control: DropdownListDefinition;
};

type Item = {
	readonly name?: string;
	readonly description?: string;
};

export class PlayerSettingDropdown<T extends string> extends PlayerSettingBase<PlayerSettingDropdownDefinition, T> {
	constructor(gui: PlayerSettingDropdownDefinition, name: string, items: { readonly [k in T]: Item }) {
		super(gui, name, firstKey(items)!);

		const control = this.parent(new DropdownList<T>(gui.Control));
		for (const [k, { name, description }] of pairs(items)) {
			const btn = control.addItem(k, name);
			if (description) {
				btn.setTooltipText(description);
			}
		}

		this.event.subscribe(control.submitted, (value) => this.v.submit(value));
		this.value.connect(control.selectedItem as ObservableValue<T>);
	}
}
