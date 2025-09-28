import { AchievementsGui } from "client/controller/AchievementController";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import type { AchievementsGuiDefinition } from "client/controller/AchievementController";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsAchievements extends Control {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		const sc = Interface.getInterface<{
			Popups: { Crossplatform: { Achievements: { Content: { ScrollingFrame: AchievementsGuiDefinition } } } };
		}>().Popups.Crossplatform.Achievements.Content.ScrollingFrame;
		sc.TemplatePB.Clone().Parent = gui;
		sc.Settings.Clone().Parent = gui;

		this.onInject((di) => {
			this.parent(di.resolveForeignClass(AchievementsGui, [gui as never]));
		});
	}
}
