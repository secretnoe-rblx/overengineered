import { Scene } from "client/gui/Scene";
import { requestMode } from "client/modes/PlayModeRequest";
import { ButtonComponent } from "engine/client/gui/ButtonComponent";
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

		const runButton = this.parent(mainScreen.registerTopCenterButton("Run"));
		this.event.subscribeObservable(mode.canRun, (canRun) => runButton.visible.set("build_main", canRun), true);
		this.parent(new ButtonComponent(runButton.instance, () => requestMode("ride")));

		const savesButton = this.parent(mainScreen.registerTopCenterButton("Saves"));
		this.event.subscribeObservable(
			mode.canSaveOrLoad,
			(canSaveOrLoad) => savesButton.visible.set("build_main", canSaveOrLoad),
			true,
		);
		this.parent(new ButtonComponent(savesButton.instance, () => di.resolve<SavePopup>().show()));
	}
}
