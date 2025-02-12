import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { Objects } from "engine/shared/fixes/Objects";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { PlayerSelectorColumnControlDefinition } from "client/gui/controls/PlayerSelectorListControl";

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Blacklist: ConfigControlBlacklistDefinition;
	}
}

export type ConfigControlBlacklistDefinition = ConfigControlBaseDefinition & PlayerSelectorColumnControlDefinition;
export class ConfigControlBlacklist extends ConfigControlBase<ConfigControlBlacklistDefinition, readonly number[]> {
	constructor(gui: ConfigControlBlacklistDefinition, name: string) {
		super(gui, name);

		const control = this.parent(new PlayerSelectorColumnControl(gui));
		this.initFromMultiWithDefault(control.value.asArray(), () => Objects.empty);
		this.event.subscribe(control.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
