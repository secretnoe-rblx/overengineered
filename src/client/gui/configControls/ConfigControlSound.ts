import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { TextBoxControlDefinition } from "engine/client/gui/TextBoxControl";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Sound: ConfigControlSoundDefinition;
	}
}

export type ConfigControlSoundDefinition = ConfigControlBaseDefinition & {
	readonly Buttons: GuiObject & {
		readonly TextBox: TextBoxControlDefinition;
	};
};
export class ConfigControlSound extends ConfigControlBase<ConfigControlSoundDefinition, BlockLogicTypes.SoundValue> {
	constructor(gui: ConfigControlSoundDefinition, name: string) {
		super(gui, name);

		const control = this.parent(new TextBoxControl(gui.Buttons.TextBox));

		this.initFromMultiWithDefault(
			this.event.addObservable(
				control.text.fCreateBased(
					(c): BlockLogicTypes.SoundValue => ({ id: c }),
					(c) => c.id,
				),
			),
			() => ({ id: "" }),
		);
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => ({ id: value }))));
	}
}
