import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsCamera extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Camera");
		{
			this.addSlider("Field of View", { min: 1, max: 120, inputStep: 1 }) //
				.initToObjectPart(value, ["betterCamera", "fov"], "value");

			this.addToggle("Improved") //
				.initToObjectPart(value, ["betterCamera", "improved"]);

			this.addToggle("Strict Follow") //
				.initToObjectPart(value, ["betterCamera", "strictFollow"])
				.setDescription("Strictly follow the player");

			this.addToggle("Player Centered") //
				.initToObjectPart(value, ["betterCamera", "playerCentered"])
				.setDescription("Center camera at the player instead of the vehicle");
		}
	}
}
