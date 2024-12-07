import { Scene } from "client/gui/Scene";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { Theme } from "client/Theme";

@injectable
export class BuildingModeScene extends Scene {
	constructor(
		@inject readonly mode: BuildingMode,
		@inject mainScreen: MainScreenLayout,
		@inject theme: Theme,
	) {
		super();

		this.parent(mainScreen.registerTopCenterButton("Run"))
			.themeButton(theme, "accent")
			.subscribeToAction(mode.runAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("Saves"))
			.themeButton(theme, "buttonNormal")
			.subscribeToAction(mode.openSavePopupAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("TeleportToPlot"))
			.themeButton(theme, "buttonNormal")
			.subscribeToAction(mode.teleportToPlotAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}
