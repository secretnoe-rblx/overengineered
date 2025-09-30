import { AchievementsGui } from "client/controller/AchievementController";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsAchievements extends Control {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		const sc = Interface.getInterface<{
			Popups: { Crossplatform: { Achievements: { Content: GuiObject } } };
		}>().Popups.Crossplatform.Achievements.Content.Clone();
		sc.Parent = gui;

		this.onInject((di) => {
			this.parent(di.resolveForeignClass(AchievementsGui, [sc as never]));
		});
	}
}
