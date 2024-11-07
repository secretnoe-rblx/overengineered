import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { Interface } from "client/gui/Interface";
import { Scene } from "client/gui/Scene";
import { requestMode } from "client/modes/PlayModeRequest";
import { ButtonControl } from "engine/client/gui/Button";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";

@injectable
export class BuildingModeScene extends Scene {
	constructor(
		@inject readonly mode: BuildingMode,
		@inject tools: ToolController,
		@inject mainScreen: MainScreenLayout,
		@inject di: DIContainer,
	) {
		super();

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

		const hotbarGui = Interface.getInterface<{ Hotbar: HotbarControlDefinition }>().Hotbar;
		const toolbar = this.parent(new HotbarControl(tools, hotbarGui));

		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);
	}
}
