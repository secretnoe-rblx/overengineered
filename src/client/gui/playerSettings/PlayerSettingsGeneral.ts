import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsGeneral extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addToggle("Music") //
				.initToObjectPart(value, ["music"])
				.setDescription("Music. Space only, for now.");

			this.addToggle("Automatic slot loading") //
				.initToObjectPart(value, ["autoLoad"])
				.setDescription("Automatically load 'Last Exit' slot on join");
		}
	}
}
