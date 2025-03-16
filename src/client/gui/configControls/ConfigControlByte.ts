import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { ByteEditor } from "client/gui/controls/ByteEditorControl";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { ByteEditorDefinitionParts } from "client/gui/controls/ByteEditorControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Byte: ConfigControlByteDefinition;
	}
}

export type ConfigControlByteDefinition = ConfigControlBaseDefinition & ByteEditorDefinitionParts;
export class ConfigControlByte extends ConfigControlBase<ConfigControlByteDefinition, number> {
	constructor(gui: ConfigControlByteDefinition, name: string) {
		super(gui, name);

		const control = this.parent(new ByteEditor(gui));

		this.initFromMultiWithDefault(control.value, () => 0);
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
