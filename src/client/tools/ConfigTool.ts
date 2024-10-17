import { Players } from "@rbxts/services";
import { MultiBlockConfigControl } from "client/gui/BlockConfigControls";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { LogControl } from "client/gui/static/LogControl";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockHighlightedSelector } from "client/tools/highlighters/MultiBlockHighlightedSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { JSON } from "engine/shared/fixes/Json";
import { Objects } from "engine/shared/fixes/Objects";
import { Localization } from "engine/shared/Localization";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { BlockManager } from "shared/building/BlockManager";
import { Colors } from "shared/Colors";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { ReportSubmitController } from "client/gui/popup/ReportSubmitPopup";
import type { ActionController } from "client/modes/build/ActionController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { MultiBlockSelectorConfiguration } from "client/tools/highlighters/MultiBlockSelector";
//import type { TutorialConfigBlockHighlight } from "client/tutorial/TutorialConfigTool";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { BlockLogicBothDefinitions } from "shared/blockLogic/BlockLogic";

namespace Scene {
	export type ConfigToolSceneDefinition = GuiObject & {
		readonly ParamsSelection: Frame & {
			readonly Content: GuiObject & {
				readonly ScrollingFrame: GuiObject;
			};
			readonly Heading: GuiObject & {
				readonly NameLabel: TextLabel;
				readonly AmountLabel: TextLabel;
			};
		};
		readonly Bottom: {
			readonly DeselectButton: TextButton;
			readonly ResetButton: TextButton;
		};
	};
	@injectable
	export class ConfigToolScene extends Control<ConfigToolSceneDefinition> {
		constructor(
			gui: ConfigToolSceneDefinition,
			@inject private readonly tool: ConfigTool,
			@inject private readonly blockList: BlockList,
			@inject private readonly di: DIContainer,
			@inject private readonly reportSubmitter: ReportSubmitController,
			@inject actionController: ActionController,
		) {
			super(gui);

			const selected = tool.selected;
			this.event.subscribeCollection(selected, () => {
				this.updateConfigs(selected.getArr());
			});
			this.event.subscribe(actionController.onRedo, () => {
				this.updateConfigs(selected.getArr());
			});
			this.event.subscribe(actionController.onUndo, () => {
				this.updateConfigs(selected.getArr());
			});

			this.gui.Bottom.DeselectButton.Activated.Connect(() => {
				tool.unselectAll();
			});

			this.gui.Bottom.ResetButton.Activated.Connect(async () => {
				$log(`Resetting (${selected.get().size()}) block config values`);

				const response = await ClientBuilding.resetConfigOperation.execute({
					plot: tool.targetPlot.get(),
					blocks: selected.getArr(),
				});

				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
				}

				this.updateConfigs(selected.getArr());
			});

			this.onEnable(() => this.updateConfigs([]));
			this.onDisable(() => {
				this.currentConfigControl?.destroy();
				this.currentConfigControl = undefined;
			});
			this.onPrepare((inputType) => {
				this.gui.Bottom.DeselectButton.Visible = inputType !== "Gamepad";
			});
		}

		show() {
			super.show();

			GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
			GuiAnimator.transition(this.gui.Bottom.DeselectButton, 0.22, "down");
		}

		private currentConfigControl?: MultiBlockConfigControl;
		private updateConfigs(selected: readonly BlockModel[]) {
			this.currentConfigControl?.destroy();
			this.currentConfigControl = undefined;

			const wasVisible = this.gui.Visible;

			this.gui.Visible = selected.size() !== 0;
			if (!this.gui.Visible) return;

			if (!wasVisible) GuiAnimator.transition(this.gui, 0.2, "up");
			const blockmodel = selected[0];
			const block = this.blockList.blocks[BlockManager.manager.id.get(blockmodel)!];
			if (!block) return;

			const onedef = block.logic?.definition.input;
			if (!onedef) return;

			const deforder = block.logic?.definition.inputOrder;

			this.gui.Visible = Objects.size(onedef) !== 0;
			if (!this.gui.Visible) return;

			this.gui.ParamsSelection.Heading.NameLabel.Text = Localization.translateForPlayer(
				Players.LocalPlayer,
				block.displayName,
			).fullUpper();
			this.gui.ParamsSelection.Heading.AmountLabel.Text = selected.size() > 1 ? `x${selected.size()}` : "";

			const configs = selected.map((selected) => {
				const blockmodel = selected;
				const id = BlockManager.manager.id.get(blockmodel)!;
				const block = this.blockList.blocks[id];
				if (!block) return undefined!;

				const defs = block.logic?.definition.input;
				if (!defs) return undefined!;

				const config = BlockConfig.addDefaults(
					BlockManager.manager.config.get(blockmodel) as PlacedBlockConfig,
					defs,
				);
				return {
					blockmodel,
					uuid: BlockManager.manager.uuid.get(blockmodel),
					config,
				} as const;
			});

			this.gui.ParamsSelection.Content.ScrollingFrame.Visible = false;

			const markered = BlockWireManager.fromPlot(
				this.tool.targetPlot.get(),
				this.tool.blockList,
				selected.map(BlockManager.manager.uuid.get),
			);

			const gui = this.gui.ParamsSelection.Content.ScrollingFrame.Clone();
			gui.Visible = true;
			gui.Parent = this.gui.ParamsSelection.Content;

			try {
				const configControl = this.add(
					this.di.resolveForeignClass(MultiBlockConfigControl, [
						gui,
						onedef,
						asObject(configs.mapToMap((c) => $tuple(c.uuid, c.config))),
						deforder,
						markered,
					]),
				);
				this.currentConfigControl = configControl;

				configControl.travelledTo.Connect((uuid) => {
					this.tool.unselectAll();
					this.tool.selectBlockByUuid(uuid);
				});
				configControl.submitted.Connect((config) => {
					const selected = this.tool.selected.get();
					$log(`Sending (${selected.size()}) block config values ${JSON.serialize(asMap(config).values())}`);

					const response = ClientBuilding.updateConfigOperation.execute({
						plot: this.tool.targetPlot.get(),
						configs: selected.map(
							(b) =>
								({
									block: b,
									cfg: config[BlockManager.manager.uuid.get(b)] as never,
								}) satisfies ClientBuilding.UpdateConfigArgs["configs"][number],
						),
					});
					if (!response.success) {
						LogControl.instance.addLine(response.message, Colors.red);
						this.updateConfigs([...selected]);
					}
				});
			} catch (err) {
				this.reportSubmitter.submit({
					err,
					selected,
					configs,
				});
			}
		}
	}
}

type TutorialConfigBlockHighlight = { position: Vector3 }; // TODO: config tool tutorial something delete this or not
@injectable
export class ConfigTool extends ToolBase {
	readonly blocksToConfigure: TutorialConfigBlockHighlight[] = [];
	readonly selected = new ObservableCollectionSet<BlockModel>();

	constructor(
		@inject mode: BuildingMode,
		@inject readonly blockList: BlockList,
		@inject di: DIContainer,
	) {
		super(mode);
		this.parentGui(
			di.resolveForeignClass(Scene.ConfigToolScene, [
				ToolBase.getToolGui<"Config", Scene.ConfigToolSceneDefinition>().Config,
			]),
		);

		this.parent(di.resolveForeignClass(SelectedBlocksHighlighter, [this.selected]));

		const canBeSelected = (block: BlockModel): boolean => {
			if (this.blocksToConfigure.size() > 0) {
				if (
					!this.blocksToConfigure.any(
						(value) =>
							VectorUtils.roundVector3(value.position) ===
							VectorUtils.roundVector3(
								this.targetPlot
									.get()
									.instance.BuildingArea.GetPivot()
									.PointToObjectSpace(block.GetPivot().Position),
							),
					)
				) {
					return false;
				}
			}

			const configDef = blockList.blocks[BlockManager.manager.id.get(block)]?.logic?.definition;
			if (!configDef) return false;

			if (!asMap((configDef as BlockLogicBothDefinitions).input).findValue((k, v) => !v.configHidden)) {
				return false;
			}

			return true;
		};
		const canBeSelectedConsideringCurrentSelection = (block: BlockModel): boolean => {
			if (!canBeSelected(block)) {
				return false;
			}

			if (this.selected.size() === 0) {
				return true;
			}

			if (InputController.isShiftPressed() || InputController.inputType.get() === "Touch") {
				const differentId = this.selected
					.get()
					.find((s) => BlockManager.manager.id.get(s) !== BlockManager.manager.id.get(block));
				return differentId === undefined;
			}

			return true;
		};

		const config: MultiBlockSelectorConfiguration = {
			filter: canBeSelectedConsideringCurrentSelection,
			enabled: ["single"],
			/*modeSetMiddleware: (mode, prev) => {
				if (!InputController.isShiftPressed()) {
					if (mode === "assembly" || mode === "machine" || mode === "box") {
						return prev;
					}
				}

				return mode;
			},*/
		};
		this.parent(new MultiBlockHighlightedSelector(mode.targetPlot, this.selected, undefined, config));

		// TODO: remove false later, deselects everything after any change
		if (false as boolean)
			this.subscribeToCurrentPlot((plot) => {
				if (!this.selected.get().find((s) => s.IsDescendantOf(plot.instance))) {
					return;
				}

				this.selected.clear();
			});
	}

	selectBlockByUuid(uuid: BlockUuid) {
		this.selected.push(this.targetPlot.get().getBlock(uuid));
	}
	unselectAll() {
		this.selected.clear();
	}

	getDisplayName(): string {
		return "Configuring";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15414751900";
	}

	disable() {
		super.disable();
		this.unselectAll();
	}
}
