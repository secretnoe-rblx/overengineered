import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsInterface extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Interface");
		{
			this.addSlider("UI Scale", { min: 0.5, max: 2, inputStep: 0.01 }) //
				.initToObjectPart(value, ["uiScale"]);
		}

		this.addCategory("Beacons") //
			.setTooltipText("On-screen position indicators");
		{
			this.addToggle("Players") //
				.initToObjectPart(value, ["beacons", "players"]);
			this.addToggle("Plot") //
				.initToObjectPart(value, ["beacons", "plot"]);
		}
	}
}
