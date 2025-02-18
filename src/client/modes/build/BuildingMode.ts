import { LoadingController } from "client/controller/LoadingController";
import { MirrorVisualizer } from "client/controller/MirrorVisualizer";
import { SavePopup } from "client/gui/popup/SavePopup";
import { Scene } from "client/gui/Scene";
import { ActionController } from "client/modes/build/ActionController";
import { CenterOfMassController } from "client/modes/build/CenterOfMassController";
import { GridController } from "client/modes/build/GridController";
import { PlayMode } from "client/modes/PlayMode";
import { requestMode } from "client/modes/PlayModeRequest";
import { BuildTool } from "client/tools/BuildTool";
import { ConfigTool } from "client/tools/ConfigTool";
import { DeleteTool } from "client/tools/DeleteTool";
import { EditTool } from "client/tools/EditTool";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { PaintTool } from "client/tools/PaintTool";
import { WireTool } from "client/tools/WireTool";
import { Action } from "engine/client/Action";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { NumberObservableValue } from "engine/shared/event/NumberObservableValue";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Objects } from "engine/shared/fixes/Objects";
import { SharedRagdoll } from "shared/SharedRagdoll";
import type { MainScene } from "client/gui/MainScene";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { Theme } from "client/Theme";
import type { ToolBase } from "client/tools/ToolBase";
import type { ToolController } from "client/tools/ToolController";
import type { SharedPlot } from "shared/building/SharedPlot";

declare global {
	type MirrorMode = {
		readonly x?: number;
		readonly y?: number;
		readonly z?: number;
	};
}

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

export type EditMode = "global" | "local";

@injectable
export class BuildingMode extends PlayMode {
	readonly openSavePopupAction = this.parent(new Action());
	readonly runAction = this.parent(new Action(() => requestMode("ride")));
	readonly teleportToPlotAction = this.parent(new Action(() => this.teleportToPlot()));

	readonly mirrorMode = new ObservableValue<MirrorMode>({});
	readonly targetPlot;
	readonly mirrorVisualizer;
	readonly gridEnabled = new ObservableValue(true);
	readonly moveGrid = new NumberObservableValue<number>(1, 0, 256, 0.001);
	readonly rotateGrid = new NumberObservableValue<number>(90, 0, 360, 0.001);
	readonly editMode = new ObservableValue<EditMode>("global");
	readonly tools;

	private readonly actionController;

	constructor(
		@inject plot: SharedPlot,
		@inject private readonly toolController: ToolController,
		@inject mainScene: MainScene,
		@inject popupController: PopupController,
		@inject di: DIContainer,
	) {
		super();

		mainScene.openSettingsAction.subCanExecuteFrom({
			buildMode: this.enabledState,
		});

		this.openSavePopupAction.subscribe(() => popupController.createAndShow(SavePopup));

		di = di.beginScope((di) => {
			di.registerSingletonValue(this);
			di.registerSingletonClass(ActionController);
			di.registerSingletonClass(CenterOfMassController);
			di.registerSingletonClass(GridController).withArgs([this.moveGrid, this.rotateGrid, this.editMode]);

			di.registerSingletonClass(BuildTool);
			di.registerSingletonClass(EditTool);
			di.registerSingletonClass(DeleteTool);
			di.registerSingletonClass(ConfigTool);
			di.registerSingletonClass(PaintTool);
			di.registerSingletonClass(WireTool);
		});

		this.event.subscribeObservable(
			toolController.selectedTool,
			(tool) => this.mirrorVisualizer.setEnabled(tool?.supportsMirror() ?? false),
			true,
		);

		let mg = this.moveGrid.get();
		let rg = this.moveGrid.get();
		this.event.subInput((ih) => {
			ih.onKeyDown("LeftControl", () => {
				this.gridEnabled.set(false);

				mg = this.moveGrid.get();
				this.moveGrid.set(0);

				rg = this.rotateGrid.get();
				this.rotateGrid.set(0);
			});
			ih.onKeyUp("LeftControl", () => {
				this.gridEnabled.set(true);
				this.moveGrid.set(mg);
				this.rotateGrid.set(rg);
			});
		});

		this.runAction.subCanExecuteFrom({
			notLoading: LoadingController.isNotLoading,
		});
		this.openSavePopupAction.subCanExecuteFrom({
			notLoading: LoadingController.isNotLoading,
		});

		this.targetPlot = new ObservableValue<SharedPlot>(plot);
		this.targetPlot.subscribePrev((plot, prev) => {
			const index = BlockSelect.blockRaycastParams.FilterDescendantsInstances.indexOf(prev.instance);
			if (index !== -1) {
				BlockSelect.blockRaycastParams.FilterDescendantsInstances.remove(index);
			}

			BlockSelect.blockRaycastParams.AddToFilter(plot.instance);
		}, true);
		this.mirrorVisualizer = this.parent(new MirrorVisualizer(this.targetPlot, this.mirrorMode));

		this.parent(di.resolveForeignClass(BuildingModeScene));

		this.actionController = this.parent(di.resolve<ActionController>());
		this.parent(di.resolve<GridController>());
		this.parent(di.resolve<CenterOfMassController>());

		this.event.subInput((ih) => {
			ih.onKeyDown("LeftControl", () => this.gridEnabled.set(false));
			ih.onKeyUp("LeftControl", () => this.gridEnabled.set(true));
		});

		const tools = [
			["buildTool", di.resolve<BuildTool>()],
			["editTool", di.resolve<EditTool>()],
			["deleteTool", di.resolve<DeleteTool>()],
			["configTool", di.resolve<ConfigTool>()],
			["paintTool", di.resolve<PaintTool>()],
			["wireTool", di.resolve<WireTool>()],
		] as const;
		const toolsArr: readonly ToolBase[] = tools.map((t) => t[1]);

		this.tools = Objects.fromEntries(tools);

		this.onEnable(() => toolController.tools.add(...toolsArr));
		this.onDisable(() => toolController.tools.remove(...toolsArr));

		// this.onEnable(() => {
		// 	di.resolveForeignClass(TestTutorial2).enable();
		// });
	}

	getName(): PlayModes {
		return "build";
	}

	teleportToPlot() {
		const rootPart = LocalPlayer.rootPart.get();
		if (!rootPart) return;

		const humanoid = LocalPlayer.humanoid.get();
		if (!humanoid) return;

		if (SharedRagdoll.isPlayerRagdolling(humanoid)) {
			task.spawn(() => SharedRagdoll.event.send(false));
		}

		if (humanoid.Sit) {
			humanoid.Sit = false;
			task.wait();
		}

		const pos = this.targetPlot.get().getSpawnCFrame();
		rootPart.CFrame = pos;
		rootPart.AssemblyLinearVelocity = Vector3.zero;
		rootPart.AssemblyAngularVelocity = Vector3.zero;
	}

	switchTutorialMode(tutorialMode: boolean): void {
		this.actionController.undoAction.canExecute.and("build_tutorialMode", !tutorialMode);
		this.actionController.redoAction.canExecute.and("build_tutorialMode", !tutorialMode);

		if (tutorialMode) {
			this.toolController.enabledTools.disableAll();
		} else {
			this.toolController.enabledTools.enableAll();
		}

		this.openSavePopupAction.canExecute.and("this_tutorialMode", !tutorialMode);
		this.runAction.canExecute.and("this_tutorialMode", !tutorialMode);
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		const plot = this.targetPlot.get();

		const tp = () => {
			const rootPart = LocalPlayer.rootPart.get();
			if (!rootPart) return;

			const pos = plot.getSpawnPosition();
			if (rootPart.Position.sub(pos).Magnitude < plot.instance.BuildingArea.ExtentsSize.X) {
				return;
			}

			this.teleportToPlot();
		};

		if (!prev) {
			task.delay(0.1, () => this.teleportToPlot());
		} else {
			task.delay(0.1, tp);
		}
	}
}
