import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { MultiKeyNumberControl } from "client/gui/MultiKeyNumberControl";
import { Objects } from "engine/shared/fixes/Objects";
import type {
	ConfigControlBaseDefinition,
	ConfigControlBaseDefinitionParts,
} from "client/gui/configControls/ConfigControlBase";
import type { MultiKeyPart } from "client/gui/MultiKeyNumberControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly MultiKeys: ConfigControlMultiKeysDefinition;
	}
}

export type ConfigControlMultiKeysParts = ConfigControlBaseDefinitionParts & {
	readonly AddButton: GuiButton;
};
export type ConfigControlMultiKeysDefinition = ConfigControlBaseDefinition & {
	readonly Buttons: GuiObject;
};

export class ConfigControlMultiKeys extends ConfigControlBase<
	ConfigControlMultiKeysDefinition,
	readonly MultiKeyPart[],
	ConfigControlMultiKeysParts
> {
	constructor(
		gui: ConfigControlMultiKeysDefinition,
		name: string,
		defaultValue: number,
		min: number | undefined,
		max: number | undefined,
	) {
		super(gui, name);

		const control = this.parent(
			new MultiKeyNumberControl(gui.Buttons, defaultValue, min, max, { AddButton: this.parts.AddButton }),
		);

		this.initFromMultiWithDefault(control.v.value, () => Objects.empty);
		this.event.subscribe(control.v.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
