import { Interface } from "client/gui/Interface";
import { Scene } from "client/gui/Scene";
import { requestMode } from "client/modes/PlayModeRequest";
import { ButtonControl } from "engine/client/gui/Button";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { BuildingMode } from "client/modes/build/BuildingMode";

@injectable
export class BuildingModeScene extends Scene {
	constructor(
		@inject readonly mode: BuildingMode,
		@inject mainScreen: MainScreenLayout,
		@inject di: DIContainer,
	) {
		super();

		this.onEnabledStateChange(
			(enabled) => (Interface.getGameUI<{ BuildingMode: GuiObject }>().BuildingMode.Visible = enabled),
		);

		const runButton = mainScreen.registerTopCenterButton("Run");
		this.event.subscribeObservable(mode.canRun, (canRun) => runButton.visible.set("build_main", canRun), true);
		this.parent(new ButtonControl(runButton.instance, () => requestMode("ride")));

		const savesButton = mainScreen.registerTopCenterButton("Saves");
		this.event.subscribeObservable(
			mode.canSaveOrLoad,
			(canSaveOrLoad) => savesButton.visible.set("build_main", canSaveOrLoad),
			true,
		);
		this.parent(new ButtonControl(savesButton.instance, () => di.resolve<SavePopup>().show()));

		this.onEnabledStateChange((enabled) => {
			runButton.visible.set("build_enabled", enabled);
			savesButton.visible.set("build_enabled", enabled);
		}, true);
	}
}
