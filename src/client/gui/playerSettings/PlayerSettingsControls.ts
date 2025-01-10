import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsControls extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addSlider("Sprint speed", { min: 20, max: 200, inputStep: 0.01 }) //
				.initToObjectPart(value, ["sprintSpeed"]);
		}

		this.addCategory("Ragdoll");
		{
			this.addToggle("Automatic trigger") //
				.initToObjectPart(value, ["ragdoll", "autoFall"]);

			this.addToggle("Automatic recovery") //
				.initToObjectPart(value, ["ragdoll", "autoRecovery"]);

			this.addKey("Trigger key") //
				.initToObjectPart(value, ["ragdoll", "triggerKey"]);
		}
	}
}
