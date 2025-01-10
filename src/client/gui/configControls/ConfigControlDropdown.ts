import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { DropdownList } from "client/gui/controls/DropdownList";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Dropdown: ConfigControlDropdownDefinition;
	}
}

export type ConfigControlDropdownDefinition = ConfigControlBaseDefinition & {
	readonly Control: DropdownListDefinition;
};

type Item = {
	readonly name?: string;
	readonly description?: string;
};

export class ConfigControlDropdown<T extends string> extends ConfigControlBase<ConfigControlDropdownDefinition, T> {
	constructor(gui: ConfigControlDropdownDefinition, name: string, items: { readonly [k in T]: Item }) {
		super(gui, name, firstKey(items)!);

		const control = this.parent(new DropdownList<T>(gui.Control));
		for (const [k, { name, description }] of pairs(items)) {
			const btn = control.addItem(k, name);
			if (description) {
				btn.setTooltipText(description);
			}
		}

		this.event.subscribe(control.submitted, (value) => this._v.submit(value));
		this._value.connect(control.selectedItem as ObservableValue<T>);
	}
}
