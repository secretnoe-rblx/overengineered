import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";

export class PlayerSettingsInterface extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList) {
		super(gui);

		this.addCategory("Camera");
		this.addSlider("Field of View", { min: 1, max: 120, inputStep: 1 });
		this.addToggle("Improved");
		this.addToggle("Strict Follow") //
			.setTooltipText("Strictly follow the player");
		this.addToggle("Player Centered") //
			.setTooltipText("Center camera at the player instead of the vehicle");
	}
}
