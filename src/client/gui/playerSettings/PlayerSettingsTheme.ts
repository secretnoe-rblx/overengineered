import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsTheme extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Selection");
		{
			this.addColor("Surface color", true) //
				.initColor(
					value,
					["visuals", "selection", "surfaceColor"],
					["visuals", "selection", "surfaceTransparency"],
				);

			this.addColor("Border color", true) //
				.initColor(
					value,
					["visuals", "selection", "borderColor"],
					["visuals", "selection", "borderTransparency"],
				);

			this.addSlider("Border thickness", { min: 0.01, max: 1, inputStep: 0.01 }) //
				.initToObjectPart(value, ["visuals", "selection", "borderThickness"]);
		}

		this.addCategory("Active selection");
		{
			this.addColor("Surface color", true) //
				.initColor(
					value,
					["visuals", "multiSelection", "surfaceColor"],
					["visuals", "multiSelection", "surfaceTransparency"],
				);

			this.addColor("Border color", true) //
				.initColor(
					value,
					["visuals", "multiSelection", "borderColor"],
					["visuals", "multiSelection", "borderTransparency"],
				);

			this.addSlider("Border thickness", { min: 0.01, max: 1, inputStep: 0.01 }) //
				.initToObjectPart(value, ["visuals", "multiSelection", "borderThickness"]);
		}
	}
}
