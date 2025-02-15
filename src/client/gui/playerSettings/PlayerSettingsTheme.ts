import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsTheme extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		const df = PlayerConfigDefinition.visuals.config;
		const dffrom = (transparency: number, color: Color3): Color4 => ({ alpha: 1 - transparency, color });

		this.addCategory("Selection");
		{
			this.addColor("Surface color", dffrom(df.selection.surfaceTransparency, df.selection.surfaceColor), true) //
				.initColor(
					value,
					["visuals", "selection", "surfaceColor"],
					["visuals", "selection", "surfaceTransparency"],
				);

			this.addColor("Border color", dffrom(df.selection.borderTransparency, df.selection.borderColor), true) //
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
			this.addColor(
				"Surface color",
				dffrom(df.multiSelection.surfaceTransparency, df.multiSelection.surfaceColor),
				true,
			) //
				.initColor(
					value,
					["visuals", "multiSelection", "surfaceColor"],
					["visuals", "multiSelection", "surfaceTransparency"],
				);

			this.addColor(
				"Border color",
				dffrom(df.multiSelection.borderTransparency, df.multiSelection.borderColor),
				true,
			) //
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
