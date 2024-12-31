import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsGeneral extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addToggle("Music") //
				.initToObjectPart(value, ["music"])
				.setDescription("Music. Space only, for now.");

			this.addToggle("Automatic slot loading") //
				.initToObjectPart(value, ["autoLoad"])
				.setDescription("Automatically load 'Last Exit' slot on join");
		}
	}
}
