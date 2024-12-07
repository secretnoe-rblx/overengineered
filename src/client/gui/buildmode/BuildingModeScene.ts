import { Scene } from "client/gui/Scene";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { BuildingMode } from "client/modes/build/BuildingMode";

@injectable
export class BuildingModeScene extends Scene {
	constructor(
		@inject readonly mode: BuildingMode,
		@inject mainScreen: MainScreenLayout,
	) {
		super();

		this.parent(mainScreen.registerTopCenterButton("Run"))
			.subscribeToAction(mode.runAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("Saves"))
			.subscribeToAction(mode.openSavePopupAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("TeleportToPlot"))
			.subscribeToAction(mode.teleportToPlotAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}
