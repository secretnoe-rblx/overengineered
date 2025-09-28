import { Control } from "engine/client/gui/Control";
import { HostedService } from "engine/shared/di/HostedService";
import { CustomRemotes } from "shared/Remotes";

export type AchievementGuiDefinition = GuiObject & {
	//
};
export class AchievementGui extends Control<AchievementGuiDefinition> {
	constructor(gui: AchievementGuiDefinition) {
		super(gui);

		//
	}
}

export class AchievementController extends HostedService {
	constructor() {
		super();

		this.event.subscribe(CustomRemotes.achievements.loaded.invoked, (data) => print("AMONGUS LOADED", data));
		this.event.subscribe(CustomRemotes.achievements.update.invoked, (data) => print("AMONGUS UPDATE ", data));
	}
}
