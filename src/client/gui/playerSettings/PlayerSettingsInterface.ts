import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsInterface extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Interface");
		{
			this.addSlider("UI Scale", { min: 0.5, max: 1.5, inputStep: 0.01 }) //
				.init(value, ["uiScale"]);
		}

		this.addCategory("Camera");
		{
			this.addSlider("Field of View", { min: 1, max: 120, inputStep: 1 }) //
				.init(value, ["betterCamera", "fov"], "value");

			this.addToggle("Improved") //
				.init(value, ["betterCamera", "improved"]);

			this.addToggle("Strict Follow") //
				.init(value, ["betterCamera", "strictFollow"])
				.setDescription("Strictly follow the player");

			this.addToggle("Player Centered") //
				.init(value, ["betterCamera", "playerCentered"])
				.setDescription("Center camera at the player instead of the vehicle");
		}

		this.addCategory("Beacons") //
			.setTooltipText("On-screen position indicators");
		{
			this.addToggle("Players") //
				.init(value, ["beacons", "players"]);
			this.addToggle("Plot") //
				.init(value, ["beacons", "plot"]);
		}

		this.addCategory("Selection");
		{
			this.addColor("Border color", true) //
				.init(value, ["visuals", "selection", "borderColor"])
				.init<number>(value, ["visuals", "selection", "borderTransparency"], undefined, (s) =>
					s.alpha.createBothWayBased(
						(c) => 1 - c,
						(c) => 1 - c,
					),
				);
		}
	}
}
