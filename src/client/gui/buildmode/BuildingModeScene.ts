import { Scene } from "client/gui/Scene";
import { GuiButtonActionIndicator } from "engine/client/component/Component.propmacro";
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
			.subscribeToAction(mode.runAction, GuiButtonActionIndicator.interactability)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("Saves"))
			.subscribeToAction(mode.openSavePopupAction, GuiButtonActionIndicator.interactability)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });

		this.parent(mainScreen.registerTopCenterButton("TeleportToPlot"))
			.subscribeToAction(mode.teleportToPlotAction, GuiButtonActionIndicator.interactability)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}
