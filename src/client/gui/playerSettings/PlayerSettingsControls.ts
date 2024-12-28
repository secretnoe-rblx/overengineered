import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsControls extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addSlider("Sprint speed", { min: 20, max: 200, inputStep: 0.01 }) //
				.init(value, ["sprintSpeed"]);
		}

		this.addCategory("Ragdoll");
		{
			this.addToggle("Automatic trigger") //
				.init(value, ["ragdoll", "autoFall"]);

			this.addToggle("Automatic recovery") //
				.init(value, ["ragdoll", "autoRecovery"]);

			this.addKey("Trigger key") //
				.init(value, ["ragdoll", "triggerKey"]);
		}
	}
}
