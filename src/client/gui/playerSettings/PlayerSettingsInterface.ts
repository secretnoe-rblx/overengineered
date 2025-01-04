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
				.initToObjectPart(value, ["uiScale"]);
		}

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

		this.addCategory("Beacons") //
			.setTooltipText("On-screen position indicators");
		{
			this.addToggle("Players") //
				.initToObjectPart(value, ["beacons", "players"]);
			this.addToggle("Plot") //
				.initToObjectPart(value, ["beacons", "plot"]);
		}

		this.addCategory("Selection");
		{
			this.addColor("Surface color", true) //
				.initToObjectPart(value, ["visuals", "selection", "surfaceColor"])
				.initToObjectPart<number>(value, ["visuals", "selection", "surfaceTransparency"], undefined, (s) =>
					s.alpha.createBothWayBased(
						(c) => 1 - c,
						(c) => 1 - c,
					),
				);

			this.addColor("Border color", true) //
				.initToObjectPart(value, ["visuals", "selection", "borderColor"])
				.initToObjectPart<number>(value, ["visuals", "selection", "borderTransparency"], undefined, (s) =>
					s.alpha.createBothWayBased(
						(c) => 1 - c,
						(c) => 1 - c,
					),
				);

			this.addSlider("Border thickness", { min: 0.01, max: 1, inputStep: 0.01 }) //
				.initToObjectPart(value, ["visuals", "selection", "borderThickness"]);
		}

		this.addCategory("Active selection");
		{
			this.addColor("Surface color", true) //
				.initToObjectPart(value, ["visuals", "multiSelection", "surfaceColor"])
				.initToObjectPart<number>(value, ["visuals", "multiSelection", "surfaceTransparency"], undefined, (s) =>
					s.alpha.createBothWayBased(
						(c) => 1 - c,
						(c) => 1 - c,
					),
				);

			this.addColor("Border color", true) //
				.initToObjectPart(value, ["visuals", "multiSelection", "borderColor"])
				.initToObjectPart<number>(value, ["visuals", "multiSelection", "borderTransparency"], undefined, (s) =>
					s.alpha.createBothWayBased(
						(c) => 1 - c,
						(c) => 1 - c,
					),
				);

			this.addSlider("Border thickness", { min: 0.01, max: 1, inputStep: 0.01 }) //
				.initToObjectPart(value, ["visuals", "multiSelection", "borderThickness"]);
		}
	}
}
