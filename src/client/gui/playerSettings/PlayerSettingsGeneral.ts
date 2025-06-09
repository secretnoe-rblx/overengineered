import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsGeneral extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addSlider("Music volume", PlayerConfigDefinition.music) //
				.initToObjectPart(value, ["music"], "value")
				.setDescription("Music while building and space-ing.");

			this.addToggle("Automatic slot loading") //
				.initToObjectPart(value, ["autoLoad"])
				.setDescription("Automatically load 'Last Exit' slot on join");

			this.addToggle("Automatic teleport to plot") //
				.initToObjectPart(value, ["autoPlotTeleport"])
				.setDescription("Automatically teleport to plot after despawning your vehicle");
		}
	}
}
