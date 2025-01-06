import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsTheme extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

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
