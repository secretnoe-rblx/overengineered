import { Players } from "@rbxts/services";
import { MultiBlockConfigControl } from "client/gui/BlockConfigControls";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ReportSubmitPopup } from "client/gui/popup/ReportSubmitPopup";
import { LogControl } from "client/gui/static/LogControl";
import { MultiBlockHighlightedSelector } from "client/tools/highlighters/MultiBlockHighlightedSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { JSON } from "engine/shared/fixes/Json";
import { Objects } from "engine/shared/fixes/Objects";
import { Localization } from "engine/shared/Localization";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { BlockManager } from "shared/building/BlockManager";
import { Colors } from "shared/Colors";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { ActionController } from "client/modes/build/ActionController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ClientBuildingTypes } from "client/modes/build/ClientBuilding";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { Keybinds } from "engine/client/Keybinds";
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
		private readonly configContainer;
		private readonly configParent;

		constructor(
			gui: ConfigToolSceneDefinition,
			@inject private readonly tool: ConfigTool,
			@inject private readonly blockList: BlockList,
			@inject private readonly di: DIContainer,
			@inject private readonly popupController: PopupController,
			@inject private readonly mainScreen: MainScreenLayout,
			@inject private readonly clientBuilding: ClientBuilding,
			@inject actionController: ActionController,
		) {
			super(gui);

			type cc = GuiObject & {
				Content: GuiObject & { ScrollingFrame: ScrollingFrame };
				Header: GuiObject & { Copy: GuiButton; Paste: GuiButton; Reset: GuiButton };
			};
			this.configContainer = this.parentGui(this.mainScreen.registerLeft<cc>("Config"));
			this.configParent = this.configContainer.parent(new ComponentChild(true));

			let copiedConfig: [BlockId, PlacedBlockConfig] | undefined;
			this.parent(new Control(this.configContainer.instance.Header.Copy)) //
				.addButtonAction(() => {
					const blockmodel = selected.get().first();
					if (!blockmodel) return;

					const id = BlockManager.manager.id.get(blockmodel)!;
					const block = this.blockList.blocks[id];
					if (!block) return undefined!;

					const defs = block.logic?.definition.input;
					if (!defs) return undefined!;

					copiedConfig = [
						BlockManager.manager.id.get(blockmodel),
						BlockConfig.addDefaults(BlockManager.manager.config.get(blockmodel) as PlacedBlockConfig, defs),
					];
				});
			this.parent(new Control(this.configContainer.instance.Header.Paste)) //
				.addButtonAction(() => {
					if (!copiedConfig) return;

					const selected = this.tool.selected.get();
					if (selected.any((c) => BlockManager.manager.id.get(c) !== copiedConfig![0]))
						$log(`Sending (${selected.size()}) block config values ${JSON.serialize(copiedConfig)}`);

					const response = this.clientBuilding.updateConfigOperation.execute({
						plot: this.tool.targetPlot.get(),
						configs: selected.map(
							(b) =>
								({
									block: b,
									cfg: copiedConfig![1]!,
								}) satisfies ClientBuildingTypes.UpdateConfigArgs["configs"][number],
						),
					});
					if (!response.success) {
						LogControl.instance.addLine(response.message, Colors.red);
						this.updateConfigs([...selected]);
					}

					this.updateConfigs(this.tool.selected.getArr());
				});
			this.parent(new Control(this.configContainer.instance.Header.Reset)) //
				.addButtonAction(() => {
					const response = clientBuilding.resetConfigOperation.execute({
						plot: tool.targetPlot.get(),
						blocks: selected.getArr(),
					});

					if (!response.success) {
						LogControl.instance.addLine(response.message, Colors.red);
					}

					this.updateConfigs(selected.getArr());
				});

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

			this.onEnable(() => this.updateConfigs([]));
			this.event.onPrepare((inputType) => {
				this.gui.Bottom.DeselectButton.Visible = inputType !== "Gamepad";
			});
		}

		private updateConfigs(selected: readonly BlockModel[]) {
			this.configParent.clear();

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

			this.configContainer.instance.Content.ScrollingFrame.Visible = false;
			const gui = this.configContainer.instance.Content.ScrollingFrame.Clone();
			gui.Visible = true;
			gui.Parent = this.configContainer.instance.Content;

			try {
				const configControl = this.configParent.set(
					this.di.resolveForeignClass(MultiBlockConfigControl, [
						gui,
						onedef,
						asObject(configs.mapToMap((c) => $tuple(c.uuid, c.config))),
						deforder,
						markered,
					]),
				);

				configControl.travelledTo.Connect((uuid) => {
					this.tool.unselectAll();
					this.tool.selectBlockByUuid(uuid);
				});
				configControl.submitted.Connect((config) => {
					const selected = this.tool.selected.get();
					$log(`Sending (${selected.size()}) block config values ${JSON.serialize(asMap(config).values())}`);

					const response = this.clientBuilding.updateConfigOperation.execute({
						plot: this.tool.targetPlot.get(),
						configs: selected.map(
							(b) =>
								({
									block: b,
									cfg: config[BlockManager.manager.uuid.get(b)] as never,
								}) satisfies ClientBuildingTypes.UpdateConfigArgs["configs"][number],
						),
					});
					if (!response.success) {
						LogControl.instance.addLine(response.message, Colors.red);
						this.updateConfigs([...selected]);
					}
				});
			} catch (err) {
				this.popupController.showPopup(new ReportSubmitPopup({ err, selected, configs }));
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
		@inject keybinds: Keybinds,
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
		const filter = (blocks: readonly BlockModel[]): readonly BlockModel[] => {
			blocks = blocks.filter(canBeSelected);

			let selected = this.selected.get();
			if (!InputController.isShiftPressed() && InputController.inputType.get() === "Desktop") {
				selected = new Set();
			}

			const newBlocks = new Set<BlockModel>();
			const getIdentifier = (block: BlockModel) =>
				blockList.blocks[BlockManager.manager.id.get(block)]?.logic?.definition;

			for (const block of blocks) {
				const id = getIdentifier(block);
				const differentId =
					selected.find((s) => getIdentifier(s) !== id) ?? blocks.find((s) => getIdentifier(s) !== id);

				if (differentId === undefined) {
					newBlocks.add(block);
				}
			}

			return [...newBlocks];
		};

		this.parent(new MultiBlockHighlightedSelector(mode.targetPlot, this.selected, { filter }, keybinds));
		this.onDisable(() => this.unselectAll());
	}

	selectBlockByUuid(uuid: BlockUuid) {
		this.selected.setRange([this.targetPlot.get().getBlock(uuid)]);
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
}
