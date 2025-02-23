import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { TextBoxControlDefinition } from "engine/client/gui/TextBoxControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly String: ConfigControlStringDefinition;
	}
}

export type ConfigControlStringDefinition = ConfigControlBaseDefinition & {
	readonly Buttons: GuiObject & {
		readonly TextBox: TextBoxControlDefinition;
	};
};
export class ConfigControlString extends ConfigControlBase<ConfigControlStringDefinition, string> {
	constructor(gui: ConfigControlStringDefinition, name: string) {
		super(gui, name);

		const control = this.parent(new TextBoxControl(gui.Buttons.TextBox));

		this.initFromMultiWithDefault(control.text, () => "");
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
