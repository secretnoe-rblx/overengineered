import { SoundController } from "client/controller/SoundController";
import { MirrorEditorControl } from "client/gui/buildmode/MirrorEditorControl";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { Action } from "engine/client/Action";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import type { MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";

namespace Scene {
	export type DeleteToolSceneDefinition = GuiObject & {
		readonly TouchControls: Frame & {
			readonly DeleteButton: TextButton;
		};
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

	export class DeleteToolScene extends Control<DeleteToolSceneDefinition> {
		private tool: DeleteTool;

		constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool) {
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
				this.gui.TouchControls.Visible = false;
				this.gui.Bottom.DeleteAllButton.Visible = inputType !== "Gamepad";
			});

			this.parent(new Control(this.gui.Bottom.DeleteAllButton)) //
				.subscribeToAction(tool.clearPlotAction);

			this.parent(
				new ButtonControl(this.gui.TouchControls.DeleteButton, () => this.tool.deleteHighlightedBlocks()),
			);

			this.event.subscribeCollection(this.tool.highlightedBlocks, () => {
				if (this.tool.highlightedBlocks.size() !== 0) {
					this.gui.TouchControls.Visible = true;
					GuiAnimator.transition(this.gui.TouchControls, 0.1, "left");
				} else {
					this.gui.TouchControls.Visible = false;
				}
			});
		}
	}
}

@injectable
export class DeleteTool extends ToolBase {
	readonly highlightedBlocks = new ObservableCollectionSet<BlockModel>();
	readonly clearPlotAction: Action;

	constructor(@inject mode: BuildingMode, @inject di: DIContainer) {
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
		this.event.subscribeObservable(
			mode.targetPlot,
			(plot) => {
				plot.instance.Blocks.ChildAdded.Connect(() =>
					this.clearPlotAction.canExecute.and("plotIsEmpty", false),
				);
				plot.instance.Blocks.ChildRemoved.Connect(() =>
					this.clearPlotAction.canExecute.and("plotIsEmpty", plot.instance.Blocks.GetChildren().size() === 0),
				);
			},
			true,
		);

		this.parentGui(
			new Scene.DeleteToolScene(ToolBase.getToolGui<"Delete", Scene.DeleteToolSceneDefinition>().Delete, this),
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
		const stuff = this.parent(new MultiBlockSelector(mode.targetPlot));
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

	protected getTooltips(): InputTooltips {
		return {
			Desktop: [
				{ keys: [["LeftControl"]], text: "Assembly selection" },
				{ keys: [["LeftAlt"]], text: "Machine selection" },
				{ keys: [["E"]], text: "Box selection" },
			],
			Gamepad: [
				{ keys: [["ButtonY"]], text: "Clear all" },
				{ keys: [["ButtonX"]], text: "Delete" },
				{ keys: [["ButtonB"]], text: "Unequip" },
			],
		};
	}
}
