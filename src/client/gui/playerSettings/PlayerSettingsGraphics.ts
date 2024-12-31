import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsGraphics extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addToggle("Local shadows") //
				.initToObjectPart(value, ["graphics", "localShadows"])
				.setDescription("Shadows of your build");

			this.addToggle("Others shadows") //
				.initToObjectPart(value, ["graphics", "othersShadows"])
				.setDescription("Shadows of other builds");

			this.addToggle("Others effects") //
				.initToObjectPart(value, ["graphics", "othersEffects"])
				.setDescription("Effects of other players (e.g. fire of the rocket engine)");
		}
	}
}
