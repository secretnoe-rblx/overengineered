import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { Interface } from "client/gui/Interface";
import { Scene } from "client/gui/Scene";
import { requestMode } from "client/modes/PlayModeRequest";
import { ButtonControl } from "engine/client/gui/Button";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
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

		const initHotbar = () => {
			const hotbarGui = Interface.getInterface2<{ Hotbar: HotbarControlDefinition }>().Hotbar;
			const hotbar = this.parent(new HotbarControl(tools, hotbarGui));

			this.event.subscribeObservable(LoadingController.isLoading, (loading) => hotbar.setVisible(!loading), true);

			const visibilityFunction = Transforms.boolStateMachine(
				hotbar.instance,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: new Vector2(0.5, 1) },
				{ AnchorPoint: new Vector2(0.5, 0) },
				(tr, enabled) => (enabled ? tr.show(hotbar.instance) : 0),
				(tr, enabled) => (enabled ? 0 : tr.hide(hotbar.instance)),
			);
			hotbar.onEnabledStateChange(visibilityFunction);
		};
		initHotbar();
	}
}
