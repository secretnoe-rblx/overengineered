import { SoundController } from "client/controller/SoundController";
import { MirrorEditorControl } from "client/gui/buildmode/MirrorEditorControl";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { Action } from "engine/client/Action";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { Keybinds } from "engine/client/Keybinds";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { Tooltip } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";

namespace Scene {
	export type DeleteToolSceneDefinition = GuiObject & {
		readonly Bottom: Frame & {
			readonly DeleteAllButton: GuiButton;
		};
		readonly ActionBar: GuiObject & {
			readonly Buttons: GuiObject & {
				readonly Mirror: GuiButton;
			};
		};
		readonly Mirror: GuiObject & {
			readonly Content: MirrorEditorControlDefinition;
		};
	};

	@injectable
	export class DeleteToolScene extends Control<DeleteToolSceneDefinition> {
		private tool: DeleteTool;

		constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool, @inject mainScreen: MainScreenLayout) {
			super(gui);
			this.tool = tool;

			const mirrorEditor = this.add(new MirrorEditorControl(this.gui.Mirror.Content, tool.targetPlot.get()));
			this.event.subscribeObservable(tool.mirrorMode, (val) => mirrorEditor.value.set(val), true);
			this.event.subscribe(mirrorEditor.submitted, (val) => tool.mirrorMode.set(val));
			this.onEnable(() => (this.gui.Mirror.Visible = false));
			this.add(
				new ButtonControl(
					this.gui.ActionBar.Buttons.Mirror,
					() => (this.gui.Mirror.Visible = !this.gui.Mirror.Visible),
				),
			);
			this.event.onPrepare((inputType) => {
				this.gui.Bottom.DeleteAllButton.Visible = inputType !== "Gamepad";
			});

			this.parent(new Control(this.gui.Bottom.DeleteAllButton)) //
				.subscribeToAction(tool.clearPlotAction);

			const hasSelectedBlocks = tool.highlightedBlocks.createBased((c) => !c.isEmpty());

			const isTouch = new ObservableValue(false);
			this.event.onPrepare((inputType) => isTouch.set(inputType === "Touch"));

			this.parent(mainScreen.right.pushImage("rbxassetid://12539349041")) //
				.subscribeVisibilityFrom({ main: this.enabledState, isTouch, hasSelectedBlocks })
				.addButtonAction(() => tool.deleteHighlightedBlocks())
				.with((c) => (c.instance.BackgroundColor3 = Color3.fromRGB(52, 17, 17)));
		}
	}
}

const clearPlotKey = Keybinds.registerDefinition("delete_clearPlot", ["Delete Tool", "Clear Plot"], [["ButtonY"]]);

@injectable
export class DeleteTool extends ToolBase {
	readonly highlightedBlocks = new ObservableCollectionSet<BlockModel>();
	readonly clearPlotAction: Action;

	constructor(
		@inject mode: BuildingMode,
		@inject keybinds: Keybinds,
		@inject mainScreen: MainScreenLayout,
		@inject di: DIContainer,
	) {
		super(mode);

		this.clearPlotAction = this.parent(
			new Action(() => {
				ConfirmPopup.showPopup(
					"Are you sure you want to delete all blocks?",
					"It will be impossible to undo this action",
					() => this.deleteBlocks("all"),
				);
			}),
		);
		this.clearPlotAction.initKeybind(keybinds.fromDefinition(clearPlotKey));
		this.event.subscribeObservable(
			mode.targetPlot,
			(plot) => {
				plot.instance.Blocks.ChildAdded.Connect(() => this.clearPlotAction.canExecute.and("plotIsEmpty", true));
				plot.instance.Blocks.ChildRemoved.Connect(() =>
					this.clearPlotAction.canExecute.and("plotIsEmpty", plot.instance.Blocks.GetChildren().size() !== 0),
				);
			},
			true,
		);

		{
			const line = this.parentGui(mainScreen.bottom.push());
			line.addButton("clear plot", "12539349041", "buttonNegative", { width: 150 }) //
				.subscribeToAction(this.clearPlotAction);
		}

		this.parentGui(
			di.resolveForeignClass(Scene.DeleteToolScene, [
				ToolBase.getToolGui<"Delete", Scene.DeleteToolSceneDefinition>().Delete,
				this,
			]),
		);

		this.parent(di.resolveForeignClass(SelectedBlocksHighlighter, [this.highlightedBlocks]));

		const fireSelected = async (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;

			if (InputController.inputType.get() === "Touch") {
				this.highlightedBlocks.setRange(blocks);
				return;
			}

			await this.deleteBlocks(blocks);
		};
		const stuff = this.parent(new MultiBlockSelector(mode.targetPlot, undefined, keybinds));
		stuff.submit.Connect(fireSelected);

		this.event.onPrepareGamepad((eh, ih) => {
			ih.onKeyDown("ButtonY", () => this.clearPlotAction.execute());
		});
	}

	supportsMirror() {
		return false;
	}

	deleteHighlightedBlocks() {
		const blocks = this.highlightedBlocks.getArr();
		this.highlightedBlocks.clear();

		return this.deleteBlocks(blocks);
	}
	async deleteBlocks(blocks: readonly BlockModel[] | "all") {
		if (blocks !== "all" && blocks.size() === 0) {
			return;
		}
		if (blocks !== "all" && blocks.any((b) => !this.targetPlot.get().hasBlock(b))) {
			return;
		}

		const response = await ClientBuilding.deleteOperation.execute({ plot: this.targetPlot.get(), blocks });
		if (response.success) {
			task.wait();

			SoundController.getSounds().Build.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockDelete.Play();
		}
	}
	getDisplayName(): string {
		return "Deleting";
	}

	getImageID(): string {
		return "rbxassetid://12539349041";
	}

	protected getTooltips(): readonly Tooltip[] {
		return [
			{ keys: [["ButtonX"]], text: "Delete" },
			{ keys: [["ButtonB"]], text: "Unequip" },
		];
	}
}
