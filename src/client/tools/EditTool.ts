import { HttpService, Workspace } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { MaterialColorEditControl } from "client/gui/buildmode/MaterialColorEditControl";
import { LogControl } from "client/gui/static/LogControl";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BlockEditor } from "client/tools/additional/BlockEditor";
import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { MultiBlockHighlightedSelector } from "client/tools/highlighters/MultiBlockHighlightedSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentDisabler } from "engine/shared/component/ComponentDisabler";
import { TransformService } from "engine/shared/component/TransformService";
import { Element } from "engine/shared/Element";
import { NumberObservableValue } from "engine/shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { BB } from "engine/shared/fixes/BB";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Colors } from "shared/Colors";
import { PartUtils } from "shared/utils/PartUtils";
import type { MaterialColorEditControlDefinition } from "client/gui/buildmode/MaterialColorEditControl";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { Keybinds } from "client/Keybinds";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { BlockSelectorModeGuiDefinition } from "client/tools/highlighters/BlockSelectorModeGui";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { SharedPlot } from "shared/building/SharedPlot";

namespace Scene {
	type MultiBlockSelectorGuiDefinition = GuiObject & {
		readonly MobileSelection: BlockSelectorModeGuiDefinition;
		readonly Top: GuiObject & {
			readonly SelectAllButton: TextButtonDefinition;
			readonly DeselectAllButton: TextButtonDefinition;
		};
	};
	export class MultiBlockSelectorGui extends ClientComponent {
		constructor(gui: MultiBlockSelectorGuiDefinition, tool: EditTool) {
			super();

			const animationProps = TransformService.commonProps.quadOut02;
			const selectPlot = this.parent(new ButtonControl(gui.Top.SelectAllButton, () => tool.selectPlot()));
			const deselectAll = this.parent(new ButtonControl(gui.Top.DeselectAllButton, () => tool.deselectAll()));

			const animate = () => {
				const buttonsAreActive = this.isEnabled() && tool.selectedMode.get() === undefined;

				TransformService.run(gui.Top, (builder) =>
					builder.transform("AnchorPoint", new Vector2(0.5, buttonsAreActive ? 0 : 0.8), animationProps),
				);

				for (const control of [selectPlot, deselectAll]) {
					const button = control.instance;

					button.AutoButtonColor = button.Active = buttonsAreActive;
					TransformService.run(button, (builder) =>
						builder.transform("Transparency", buttonsAreActive ? 0 : 0.6, animationProps),
					);
				}
			};

			this.event.subscribeObservable(tool.selectedMode, animate);
			this.onEnable(animate);
			this.onDisable(animate);
		}
	}

	export interface EditToolSceneDefinition extends GuiObject, MultiBlockSelectorGuiDefinition {
		readonly CancelButton: GuiButton;
		readonly Paint: MaterialColorEditControlDefinition;
		readonly Bottom: GuiObject & {
			readonly MoveButton: GuiButton;
			readonly RotateButton: GuiButton;
			readonly ScaleButton: GuiButton;
			readonly PasteButton: GuiButton;
			readonly DeleteButton: GuiButton;
			readonly PaintButton: GuiButton;
		};
		readonly Bottom2: GuiObject & {
			readonly CopyButton: GuiButton;
			readonly MirrorXButton: GuiButton;
			readonly MirrorYButton: GuiButton;
			readonly MirrorZButton: GuiButton;
		};
	}

	export class EditToolScene extends Control<EditToolSceneDefinition> {
		readonly tool;

		constructor(gui: EditToolSceneDefinition, tool: EditTool) {
			super(gui);
			this.tool = tool;

			{
				const cancel = this.add(new ButtonControl(this.gui.CancelButton, () => tool.cancelCurrentMode()));

				const animateCancelButton = TransformService.boolStateMachine(
					cancel.instance,
					TransformService.commonProps.quadOut02,
					{ Position: cancel.instance.Position, Transparency: 0 },
					{ Position: cancel.instance.Position.add(new UDim2(0, 0, 0, 20)), Transparency: 1 },
					(tr) => tr.func(() => (cancel.instance.Interactable = false)),
					(tr) => tr.func(() => (cancel.instance.Interactable = true)),
				);

				this.event.subscribeObservable(
					tool.selectedMode,
					(mode) => animateCancelButton(mode !== undefined),
					true,
				);
			}

			const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));
			const rotate = this.add(new ButtonControl(this.gui.Bottom.RotateButton, () => tool.toggleMode("Rotate")));
			const copy = this.add(
				new ButtonControl(this.gui.Bottom2.CopyButton, () => {
					tool.copySelectedBlocks();
					paste.setInteractable(true);
				}),
			);
			const paste = this.add(new ButtonControl(this.gui.Bottom.PasteButton, () => tool.toggleMode("Paste")));
			const paint = this.add(new ButtonControl(this.gui.Bottom.PaintButton, () => tool.toggleMode("Paint")));
			const del = this.add(new ButtonControl(this.gui.Bottom.DeleteButton, () => tool.deleteSelectedBlocks()));
			const mirx = this.add(
				new ButtonControl(this.gui.Bottom2.MirrorXButton, () => tool.mirrorSelectedBlocks("x")),
			);
			const miry = this.add(
				new ButtonControl(this.gui.Bottom2.MirrorYButton, () => tool.mirrorSelectedBlocks("y")),
			);
			const mirz = this.add(
				new ButtonControl(this.gui.Bottom2.MirrorZButton, () => tool.mirrorSelectedBlocks("z")),
			);
			const scale = this.add(new ButtonControl(this.gui.Bottom.ScaleButton, () => tool.toggleMode("Scale")));

			const multiValueSetter = <T>(instance: T, func: (value: boolean) => void) => {
				const values: boolean[] = [];

				return {
					instance,
					set: (index: number, value: boolean) => {
						values[index] = value;
						func(values.all((v) => v));
					},
				} as const;
			};
			type mvs = ReturnType<typeof multiValueSetter<Control>>;

			const buttons: Readonly<Record<EditToolButtons, mvs>> = {
				// edit tool modes
				Move: multiValueSetter(move, (v) => move.setInteractable(v)),
				Rotate: multiValueSetter(rotate, (v) => rotate.setInteractable(v)),
				Paste: multiValueSetter(paste, (v) => paste.setInteractable(v)),
				Paint: multiValueSetter(paint, (v) => paint.setInteractable(v)),
				Scale: multiValueSetter(scale, (v) => scale.setInteractable(v)),

				// other buttons
				Copy: multiValueSetter(copy, (v) => copy.setInteractable(v)),
				Delete: multiValueSetter(del, (v) => del.setInteractable(v)),
				MirrorX: multiValueSetter(mirx, (v) => mirx.setInteractable(v)),
				MirrorY: multiValueSetter(miry, (v) => miry.setInteractable(v)),
				MirrorZ: multiValueSetter(mirz, (v) => mirz.setInteractable(v)),
			};
			this.event.subscribeObservable(
				tool.enabledModes.enabled,
				(enabledModes) => {
					for (const [name, button] of pairs(buttons)) {
						button.set(2, enabledModes.includes(name));
					}
				},
				true,
			);

			const updateButtonInteractability = () => {
				for (const [name, button] of pairs(buttons)) {
					button.set(0, canBeSelected(tool, name));
				}
			};
			this.event.subscribeCollection(tool.selected, updateButtonInteractability, true);
			this.event.subscribeObservable(tool.copied, updateButtonInteractability, true);

			this.event.subscribeObservable(
				tool.selectedMode,
				(mode) => {
					for (const [name, button] of pairs(buttons)) {
						button.instance.instance.BackgroundColor3 =
							mode === name ? Colors.accentDark : Colors.staticBackground;

						const enabled =
							mode === undefined ||
							mode === name ||
							(name === "Move" && (mode === "Rotate" || mode === "Scale")) ||
							(name === "Rotate" && (mode === "Move" || mode === "Scale")) ||
							(name === "Scale" && (mode === "Move" || mode === "Rotate"));
						button.set(1, enabled);
					}
				},
				true,
			);
		}

		private readonly bottomVisibilityFunction = TransformService.multi(
			TransformService.boolStateMachine(
				this.instance.Bottom,
				TransformService.commonProps.quadOut02,
				{ Position: this.instance.Bottom.Position },
				{ Position: this.instance.Bottom.Position.add(new UDim2(0, 0, 0, 20)) },
				(tr, visible) =>
					tr.func(() => {
						for (const [, button] of pairs(this.getChildren())) {
							if (button instanceof ButtonControl) {
								button.setVisible(visible);
							}
						}
					}),
				(tr, visible) => tr.func(() => super.setInstanceVisibilityFunction(visible)),
			),
			TransformService.boolStateMachine(this.instance, TransformService.commonProps.quadOut02, {}, {}),
		);
		protected setInstanceVisibilityFunction(visible: boolean): void {
			if (visible) {
				super.setInstanceVisibilityFunction(visible);
			}

			this.bottomVisibilityFunction(visible);
		}
	}
}

const placeToBlockRequest = (block: BlockModel): PlaceBlockRequestWithUuid => {
	const data = BlockManager.getBlockDataByBlockModel(block);

	return {
		...data,
		location: data.instance.GetPivot(),
		["instance" as never]: undefined,
	};
};
const placeToBlocksRequests = (blocks: readonly BlockModel[]): readonly PlaceBlockRequestWithUuid[] => {
	return blocks.map(placeToBlockRequest);
};

type PlaceBlockRequestWithUuid = PlaceBlockRequest & { readonly uuid: BlockUuid };
const reGenerateUuids = (
	plot: SharedPlot,
	_blocks: readonly PlaceBlockRequestWithUuid[],
): readonly PlaceBlockRequestWithUuid[] => {
	const existingBlocks = new Map<BlockUuid, PlaceBlockRequestWithUuid>();
	for (const block of _blocks) {
		existingBlocks.set(block.uuid, block);
	}

	// <old, new>
	const uuidmap = new Map<BlockUuid, Writable<PlaceBlockRequestWithUuid>>();

	const newblocks = existingBlocks.map((_, data): Writable<PlaceBlockRequestWithUuid> => {
		const request = { ...data, uuid: HttpService.GenerateGUID(false) as BlockUuid };
		uuidmap.set(data.uuid, request);

		return request;
	});

	const plotBlocks = plot.getBlocks().mapToSet(BlockManager.manager.uuid.get);

	for (const [olduuid, newblock] of uuidmap) {
		const config = existingBlocks.get(olduuid)?.config;
		if (!config) continue;

		const keysToDelete: string[] = [];
		for (const [key, cfg] of [...asMap(config)]) {
			if (cfg.type !== "wire") continue;
			const connection = cfg.config;

			if (!plotBlocks.has(connection.blockUuid) && !uuidmap.has(connection.blockUuid)) {
				$log(
					`Deleting a nonexistent connection ${olduuid} ${key} -> ${connection.blockUuid} ${connection.connectionName}`,
				);

				keysToDelete.push(key);
			}
		}

		const keysToChange = new Map<string, BlockUuid>();
		for (const [key, cfg] of pairs(config)) {
			if (cfg.type !== "wire") continue;
			if (keysToDelete.includes(key)) continue;
			const connection = cfg.config;

			const neww = uuidmap.get(connection.blockUuid);
			if (!neww) continue;

			$log(`Rerouting a connection ${olduuid} ${key} -> ${connection.blockUuid} ${connection.connectionName}`);
			keysToChange.set(key, neww.uuid);
		}

		const copy: Writable<typeof config> = {};
		for (const [key, cfg] of pairs(config)) {
			if (cfg.type !== "wire") {
				copy[key] = cfg;
				continue;
			}

			if (keysToDelete.includes(key)) {
				continue;
			}

			const keyToChange = keysToChange.get(key);
			if (keyToChange) {
				copy[key] = { ...cfg, config: { ...cfg.config, blockUuid: keyToChange } };
				continue;
			}

			copy[key] = cfg;
		}

		newblock.config = copy;
	}

	return newblocks;
};

namespace Controllers {
	@injectable
	export class Edit extends ClientComponent {
		private submitted = false;
		private readonly editor: BlockEditor;

		constructor(
			tool: EditTool,
			private readonly plot: SharedPlot,
			selected: readonly BlockModel[],
			startMode: "move" | "rotate" | "scale",
			@inject di: DIContainer,
		) {
			super();
			this.editor = this.parent(di.resolveForeignClass(BlockEditor, [[...selected], startMode]));
			this.event.subscribeObservable(tool.mode.moveGrid, (grid) => this.editor.moveStep.set(grid), true);
			this.event.subscribeObservable(tool.mode.rotateGrid, (grid) => this.editor.rotateStep.set(grid), true);

			this.event.subscribe(this.editor.completed, () => this.destroy());
			this.onDestroy(() => this.submit(true));
		}

		private submit(skipIfSame = true) {
			if (this.submitted) return;
			this.submitted = true;

			const update = this.editor.getUpdate();

			if (skipIfSame) {
				for (const block of update) {
					if (block.newPosition && block.newPosition !== block.origPosition) continue;
					if (block.origScale && block.newScale && block.newScale !== block.origScale) continue;

					return;
				}
			}

			const response = ClientBuilding.editOperation.execute({
				plot: this.plot,
				blocks: this.editor.getUpdate(),
			});
			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
				this.cancel();
			}

			return response.success;
		}

		deselected() {
			this.submit(false);
		}
		cancel() {
			this.submitted = true;
			this.editor.cancel();
		}
	}

	@injectable
	export class Paste extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);
		readonly rotateStep = new ObservableValue<number>(90);
		private readonly blocksRequests;
		private readonly blocks;
		private readonly editor;
		private submitted = false;

		constructor(
			private readonly tool: EditTool,
			private readonly plot: SharedPlot,
			selected: readonly BlockModel[],
			@inject blockList: BlockList,
			@inject di: DIContainer,
		) {
			super();

			const ghostParent = Element.create(
				"Model",
				{ Parent: Workspace },
				{ highlight: BlockGhoster.createHighlight({ FillColor: Colors.blue }) },
			);
			this.onDestroy(() => ghostParent.Destroy());

			const blocks = reGenerateUuids(plot, tool.copied.get());
			this.blocksRequests = blocks;
			this.blocks = blocks.map((block) => {
				const b = blockList.blocks[block.id]!.model.Clone();
				BlockManager.manager.id.set(b, block.id);
				BlockManager.manager.uuid.set(b, block.uuid);
				BlockManager.manager.scale.set(b, block.scale);
				b.PivotTo(block.location);
				SharedBuilding.scale(b, blockList.blocks[block.id]!.model, block.scale);

				PartUtils.ghostModel(b, Colors.blue);
				b.Parent = ghostParent;

				return b;
			});

			this.editor = this.parent(di.resolveForeignClass(BlockEditor, [this.blocks, "move"]));
			this.event.subscribeObservable(tool.mode.moveGrid, (grid) => this.step.set(grid), true);
			this.event.subscribeObservable(tool.mode.rotateGrid, (grid) => this.rotateStep.set(grid), true);
			this.step.autoSet(this.editor.moveStep);
			this.rotateStep.autoSet(this.editor.rotateStep);

			this.event.subscribe(this.editor.completed, () => {
				this.submit();
				this.destroy();
			});
			this.onDestroy(() => this.submit());
		}

		private submit() {
			if (this.submitted) return;
			this.submitted = true;

			const update = this.editor.getUpdate();

			const updateMap = update.mapToMap((u) => $tuple(BlockManager.manager.uuid.get(u.instance), u));

			const response = ClientBuilding.placeOperation.execute({
				plot: this.plot,
				blocks: this.blocksRequests.map((b) => ({
					...b,
					location: updateMap.get(b.uuid)?.newPosition ?? b.location,
					scale: updateMap.get(b.uuid)?.newScale ?? b.scale,
				})),
			});
			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
				this.cancel();
			} else {
				if (this.tool.isEnabled()) {
					this.tool.selected.setRange(response.models);
				}
			}

			return response.success;
		}

		deselected() {
			this.submit();
		}
		cancel() {
			this.submitted = true;
			this.editor.cancel();
			for (const block of this.blocks) {
				block.Destroy();
			}
		}
	}

	export class Paint extends ClientComponent {
		private static readonly material = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
		private static readonly color = new ObservableValue<Color3>(new Color3(1, 1, 1));
		private readonly origData: ReadonlyMap<
			BlockModel,
			{ readonly material: Enum.Material; readonly color: Color3 }
		>;
		private canceled = false;
		private readonly materialColorEditor;

		constructor(tool: EditTool, plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			this.origData = new ReadonlyMap(
				blocks.map(
					(b) =>
						[
							b,
							{
								material: BlockManager.manager.material.get(b),
								color: BlockManager.manager.color.get(b),
							},
						] as const,
				),
			);

			const ui = tool.gui.instance.Paint.Clone();
			ui.Parent = tool.gui.instance.Paint.Parent;
			const materialColorEditor = this.parentGui(new MaterialColorEditControl(ui, true));
			this.materialColorEditor = materialColorEditor;
			materialColorEditor.autoSubscribe(Paint.material, Paint.color);
			this.onEnable(() => materialColorEditor.setVisible(true));
			this.onDisable(() => materialColorEditor.setVisible(false));

			this.event.subscribeObservable(
				Paint.material,
				(material) => {
					for (const block of blocks) {
						SharedBuilding.paint([block], undefined, material);
					}
				},
				true,
			);
			this.event.subscribeObservable(
				Paint.color,
				(color) => {
					for (const block of blocks) {
						SharedBuilding.paint([block], color, undefined);
					}
				},
				true,
			);

			this.onDestroy(() => {
				if (this.canceled) return;

				const response = ClientBuilding.paintOperation.execute({
					plot,
					blocks,
					material: Paint.material.get(),
					color: Paint.color.get(),
					original: this.origData,
				});
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.cancel();
				}

				return response.success;
			});
		}

		cancel() {
			this.canceled = true;

			for (const [block, { material, color }] of this.origData) {
				SharedBuilding.paint([block], color, material);
			}
		}
	}
}

const canBeSelected = (tool: EditTool, mode: EditToolButtons): boolean => {
	if (mode === "Paste") {
		return tool.copied.get().size() !== 0;
	}

	return tool.selected.get().size() !== 0;
};

export type EditToolMode = "Move" | "Paste" | "Scale" | "Rotate" | "Paint";
export type EditToolButtons = EditToolMode | "Copy" | "Delete" | "MirrorX" | "MirrorY" | "MirrorZ";

@injectable
export class EditTool extends ToolBase {
	readonly enabledModes = new ComponentDisabler<EditToolButtons>([
		"Move",
		"Rotate",
		"Scale",
		"Copy",
		"Paste",
		"Paint",
		"Delete",
		"MirrorX",
		"MirrorY",
		"MirrorZ",
	]);

	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	readonly selected = new ObservableCollectionSet<BlockModel>();
	readonly copied = new ObservableValue<readonly PlaceBlockRequestWithUuid[]>([]);
	private readonly controller = new ComponentChild<IComponent & { cancel(): void } & ({} | { deselected(): void })>(
		this,
		true,
	);
	private readonly selector;
	readonly gui;

	constructor(
		@inject readonly mode: BuildingMode,
		@inject private readonly blockList: BlockList,
		@inject keybinds: Keybinds,
		@inject di: DIContainer,
	) {
		super(mode);

		this.gui = this.parentGui(
			new Scene.EditToolScene(ToolBase.getToolGui<"Edit2", Scene.EditToolSceneDefinition>().Edit2, this),
		);
		this.parent(di.resolveForeignClass(SelectedBlocksHighlighter, [this.selected]));

		{
			this.selector = this.parent(
				new MultiBlockHighlightedSelector(this.targetPlot, this.selected, this.gui.instance.MobileSelection),
			);
			this.event.subscribeObservable(
				this.selectedMode,
				(mode) => this.selector?.setEnabled(mode === undefined),
				true,
			);

			this.parent(new Scene.MultiBlockSelectorGui(this.gui.instance, this));
		}

		this.event.subscribeObservable(this.selectedMode, (mode) =>
			this.tooltipHolder.set(mode === undefined ? this.getTooltips() : {}),
		);

		this.onDisable(() => this.selected.clear());
		this.onDisable(() => this._selectedMode.set(undefined));
		this.event.subscribeObservable(this.targetPlot, () => this._selectedMode.set(undefined), true);

		this.controller.childSet.Connect((child) => {
			if (!child) {
				this._selectedMode.set(undefined);
			}
		});
		this.event.subscribeObservable(this.selectedMode, (mode) => {
			if (!mode) {
				const controller = this.controller.get();
				if (controller && "deselected" in controller) {
					controller.deselected();
				}

				this.controller.clear();
				return;
			}

			const selected = this.selected.get();
			if (!canBeSelected(this, mode)) {
				return;
			}

			if (mode === "Move" || mode === "Rotate" || mode === "Scale") {
				this.controller.set(
					di.resolveForeignClass(Controllers.Edit, [
						this,
						this.targetPlot.get(),
						[...selected],
						mode.lower() as never,
					]),
				);
			} else {
				this.controller.set(
					di.resolveForeignClass(Controllers[mode] as typeof Controllers.Paste, [
						this,
						this.targetPlot.get(),
						[...selected],
					]),
				);
			}
		});

		const move = keybinds.register("edit_move", "Edit tool > Move", ["F", "ButtonX"]);
		this.event.subscribeRegistration(() => move.onDown(() => this.toggleMode("Move")));

		const rotate = keybinds.register("edit_rotate", "Edit tool > Rotate", ["R"]);
		this.event.subscribeRegistration(() => rotate.onDown(() => this.toggleMode("Rotate")));

		const scale = keybinds.register("edit_scale", "Edit tool > Scale", ["B"]);
		this.event.subscribeRegistration(() => scale.onDown(() => this.toggleMode("Scale")));

		const del = keybinds.register("edit_delete", "Edit tool > Delete", ["T"]);
		this.event.subscribeRegistration(() => del.onDown(() => this.deleteSelectedBlocks()));

		const paint = keybinds.register("edit_paint", "Edit tool > Paint", ["G"]);
		this.event.subscribeRegistration(() => paint.onDown(() => this.toggleMode("Paint")));

		this.event.onKeyDown("C", () => {
			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;

			this.copySelectedBlocks();
		});
		this.event.onKeyDown("V", () => {
			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;

			this.toggleMode("Paste");
		});
	}

	cancelCurrentMode() {
		this.controller.get()?.cancel();
		this.toggleMode(undefined);
	}

	toggleMode(mode: EditToolMode | undefined) {
		if (mode && !this.enabledModes.enabled.get().includes(mode)) {
			this._selectedMode.set(undefined);
			return;
		}

		if (mode === undefined || mode === this.selectedMode.get()) {
			this._selectedMode.set(undefined);
		} else {
			if (!canBeSelected(this, mode)) {
				return;
			}

			this._selectedMode.set(undefined);
			this._selectedMode.set(mode);
		}
	}
	selectPlot() {
		this.selector.selectPlot();
	}
	deselectAll() {
		this.selector.deselectAll();
	}

	copySelectedBlocks() {
		this.copied.set(placeToBlocksRequests([...this.selected.get()]));
	}
	deleteSelectedBlocks() {
		const selected = [...this.selected.get()];
		this.selected.setRange([]);

		ClientBuilding.deleteOperation.execute({ plot: this.targetPlot.get(), blocks: selected });
	}
	mirrorSelectedBlocks(axis: "x" | "y" | "z") {
		const selected = [...this.selected.get()];
		this.selected.setRange([]);

		const center = BB.fromModels(
			selected,
			this.mode.editMode.get() === "local" ? undefined : CFrame.identity,
		).center;
		const mirrored = selected.map((s): PlaceBlockRequest => {
			const mirrored = BuildingManager.getMirroredBlocks(
				center,
				{ id: BlockManager.manager.id.get(s), pos: s.GetPivot() },
				{
					x: axis === "x" ? 0 : undefined,
					y: axis === "y" ? 0 : undefined,
					z: axis === "z" ? 0 : undefined,
				},
				this.blockList,
				false,
			);

			return {
				...placeToBlockRequest(s),
				location: mirrored[0].pos,
				id: mirrored[0].id,
			};
		});

		ClientBuilding.deleteOperation.execute({ plot: this.targetPlot.get(), blocks: selected });
		task.wait();
		ClientBuilding.placeOperation.execute({ plot: this.targetPlot.get(), blocks: mirrored });
	}

	getDisplayName(): string {
		return "Editing";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	protected getTooltips(): InputTooltips {
		return {
			Desktop: [
				{ keys: ["F"], text: "Move" },
				{ keys: ["R"], text: "Rotate" },
				{ keys: ["T"], text: "Delete" },
				{ keys: ["G"], text: "Paint" },
				{ keys: ["LeftControl", "C"], text: "Copy" },
				{ keys: ["LeftControl", "V"], text: "Paste" },
			],
			Gamepad: [{ keys: ["ButtonX"], text: "Move" }],
		};
	}
}
