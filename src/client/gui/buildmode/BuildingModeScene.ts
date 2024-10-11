import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { ButtonControl } from "client/gui/controls/Button";
import { GridEditorControl } from "client/gui/GridEditor";
import { Interface } from "client/gui/Interface";
import { ActionController } from "client/modes/build/ActionController";
import { requestMode } from "client/modes/PlayModeRequest";
import { Control } from "engine/client/gui/Control";
import { ComponentDisabler } from "engine/shared/component/ComponentDisabler";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";
import type { GridEditorControlDefinition } from "client/gui/GridEditor";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { Topbar } from "client/gui/Topbar";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { EditTool } from "client/tools/EditTool";
import type { ToolController } from "client/tools/ToolController";

type TopbarButtonsControlDefinition = GuiObject & {
	readonly Run: GuiButton;
	readonly Save: GuiButton;
	readonly Menu: GuiButton;
	//readonly Home: GuiButton;
};
@injectable
class TopbarButtonsControl extends Control<TopbarButtonsControlDefinition> {
	readonly allButtons = ["run", "save", "settings", "home"] as const;
	readonly enabledButtons = new ComponentDisabler(this.allButtons);

	constructor(gui: TopbarButtonsControlDefinition, @inject scene: BuildingModeScene, @inject di: DIContainer) {
		super(gui);

		const runButton = this.add(new ButtonControl(this.gui.Run));
		const saveButton = this.add(new ButtonControl(this.gui.Save));
		const settingsButton = this.add(new ButtonControl(this.gui.Menu));
		//const homeButton = this.add(new ButtonControl(this.gui.Home));

		this.event.subscribeObservable(
			this.enabledButtons.enabled,
			(enabled) => {
				runButton.setVisible(enabled.includes("run"));
				saveButton.setVisible(enabled.includes("save"));
				settingsButton.setVisible(enabled.includes("settings"));
				//homeButton.setVisible(enabled.includes("home"));
			},
			true,
		);

		this.event.subscribe(runButton.activated, () => requestMode("ride"));
		this.event.subscribe(saveButton.activated, () => di.resolve<SavePopup>().show());
		this.event.subscribe(settingsButton.activated, () => di.resolve<SettingsPopup>().show());
		//this.event.subscribe(homeButton.activated, () => scene.mode.teleportToPlot());
	}
}

type TopbarRightButtonsControlDefinition = GuiObject & {
	readonly Undo: GuiButton;
	readonly Redo: GuiButton;
	readonly CenterOfMass: GuiButton;
	//readonly GridSettings: GuiButton;
};
@injectable
class TopbarRightButtonsControl extends Control<TopbarRightButtonsControlDefinition> {
	constructor(
		gui: TopbarRightButtonsControlDefinition,
		@inject mode: BuildingMode,
		@inject actionController: ActionController,
		@inject editTool: EditTool,
	) {
		super(gui);

		this.event.subscribeObservable(
			editTool.selectedMode,
			(mode) => (gui.Visible = gridEditorGui.Visible = mode === undefined),
		);

		const undo = this.add(new ButtonControl(gui.Undo, () => ActionController.instance.undo()));
		const redo = this.add(new ButtonControl(gui.Redo, () => ActionController.instance.redo()));

		this.event.subscribeImmediately(actionController.history.changed, () => {
			const hasUndo = actionController.history.size() !== 0;
			undo.setVisible(hasUndo);
		});
		this.event.subscribeImmediately(actionController.redoHistory.changed, () => {
			const hasRedo = actionController.redoHistory.size() !== 0;
			redo.setVisible(hasRedo);
		});

		const gridEditorGui = Interface.getGameUI<{
			BuildingMode: { Grid: GuiObject & { Content: GridEditorControlDefinition } };
		}>().BuildingMode.Grid;
		gridEditorGui.Visible = false;

		this.add(new GridEditorControl(gridEditorGui.Content, mode.moveGrid, mode.rotateGrid, mode.editMode));
		//this.add(new ButtonControl(gui.GridSettings, () => (gridEditorGui.Visible = !gridEditorGui.Visible)));

		const com = this.add(
			new ButtonControl(gui.CenterOfMass, () => mode.centerOfMassEnabled.set(!mode.centerOfMassEnabled.get())),
		);
		this.event.subscribeObservable(
			mode.centerOfMassEnabled,
			(enabled) => (com.instance.Transparency = enabled ? 0 : 0.5),
			true,
		);
	}
}

export type BuildingModeSceneDefinition = GuiObject & {
	readonly Action: GuiObject;
	readonly HotbarNew: HotbarControlDefinition;
};
@injectable
export class BuildingModeScene extends Control<BuildingModeSceneDefinition> {
	readonly actionbar;

	constructor(
		gui: BuildingModeSceneDefinition,
		@inject readonly mode: BuildingMode,
		@inject tools: ToolController,
		@inject topbar: Topbar,
		@inject actionController: ActionController,
		@inject di: DIContainer,
	) {
		super(gui);

		gui.FindFirstChild("ActionBar")!.Destroy();

		this.add(actionController);
		gui.Action.Destroy();

		const topbarButtons = this.add(di.resolveForeignClass(TopbarButtonsControl, [topbar.getButtonsGui("Build")]));
		const topbarRightButtons = this.add(
			di.resolveForeignClass(TopbarRightButtonsControl, [topbar.getRightButtonsGui("Build")]),
		);

		this.actionbar = topbarButtons;

		const updateActionBarVisibility = () => {
			const visible = !tools.selectedTool.get() && !LoadingController.isLoading.get();

			topbarButtons.setVisible(visible);
			topbarRightButtons.setVisible(visible);
		};

		this.event.subscribeObservable(LoadingController.isLoading, updateActionBarVisibility);
		this.event.subscribeObservable(tools.selectedTool, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		gui.HotbarNew.Destroy();
		const hotbarGui = Interface.getInterface<{ Hotbar: HotbarControlDefinition }>().Hotbar;
		const toolbar = this.add(new HotbarControl(tools, hotbarGui));
		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);
	}
}
