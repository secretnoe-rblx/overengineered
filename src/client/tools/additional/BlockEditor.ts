import { Gui } from "client/gui/Gui";
import { ToolBase } from "client/tools/ToolBase";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { BB } from "engine/shared/fixes/BB";
import { Instances } from "engine/shared/fixes/Instances";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Colors } from "shared/Colors";
import type { Keybinds } from "client/Keybinds";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";

type EditHandles = BasePart & {
	readonly SelectionBox: SelectionBox;
	readonly Move: Instance & {
		readonly XHandles: Handles;
		readonly YHandles: Handles;
		readonly ZHandles: Handles;
	};
	readonly Scale: Instance & {
		readonly XHandles: Handles;
		readonly YHandles: Handles;
		readonly ZHandles: Handles;
	};
	readonly Rotate: Instance & {
		readonly Center: BasePart;
		readonly ArcHandles: ArcHandles;
	};
};

interface EditingBlock {
	readonly block: BlockModel;
	readonly origModel: BlockModel;
	readonly origLocation: CFrame;
	readonly origScale: Vector3;
}

type EditMode = "move" | "rotate" | "scale";

const repositionOne = (block: BlockModel, origModel: BlockModel, location: CFrame, scale: Vector3) => {
	block.PivotTo(location);
	SharedBuilding.scale(block, origModel, scale);
};
const reposition = (blocks: readonly EditingBlock[], originalBB: BB, currentBB: BB) => {
	const scalediff = currentBB.originalSize.div(originalBB.originalSize);

	for (const { block, origModel, origLocation, origScale } of blocks) {
		const localToOriginalLocation = originalBB.center.ToObjectSpace(origLocation);

		const newloc = currentBB.center.ToWorldSpace(
			localToOriginalLocation.Rotation.add(localToOriginalLocation.Position.mul(scalediff)),
		);
		const newscale = origScale.mul(
			originalBB.center.ToObjectSpace(origLocation).Rotation.Inverse().mul(scalediff).Abs(),
		);

		repositionOne(block, origModel, newloc, newscale);
	}
};

@injectable
class MoveComponent extends Component {
	constructor(handles: EditHandles, blocks: readonly EditingBlock[], originalBB: BB) {
		super();

		const forEachHandle = (func: (handle: Handles) => void) => {
			func(handles.Move.XHandles);
			func(handles.Move.YHandles);
			func(handles.Move.ZHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		let bb = BB.fromPart(handles);
		const sub = (handle: Handles) => {
			this.event.subscribe(handle.MouseDrag, (face, distance) => {
				const direction = bb.center.Rotation.mul(Vector3.FromNormalId(face));
				const diff = direction.mul(distance);
				handles.PivotTo(bb.center.add(diff));

				reposition(blocks, originalBB, BB.fromPart(handles));
			});

			this.event.subscribe(handle.MouseButton1Up, () => {
				bb = BB.fromPart(handles);
				reposition(blocks, originalBB, bb);
			});
		};
		forEachHandle(sub);
	}
}

@injectable
class RotateComponent extends Component {
	constructor(handles: EditHandles, blocks: readonly EditingBlock[], originalBB: BB) {
		super();

		const forEachHandle = (func: (handle: ArcHandles) => void) => {
			func(handles.Rotate.ArcHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		let bb = BB.fromPart(handles);
		const sub = (handle: ArcHandles) => {
			this.event.subscribe(handle.MouseDrag, (axis, relativeAngle, deltaRadius) => {
				const diff = CFrame.fromAxisAngle(Vector3.FromAxis(axis), relativeAngle);
				handles.PivotTo(bb.center.mul(diff));

				reposition(blocks, originalBB, BB.fromPart(handles));
			});

			this.event.subscribe(handle.MouseButton1Up, () => {
				bb = BB.fromPart(handles);
				reposition(blocks, originalBB, bb);
			});
		};
		forEachHandle(sub);
	}
}

@injectable
class ScaleComponent extends ClientComponent {
	constructor(handles: EditHandles, blocks: readonly EditingBlock[], originalBB: BB) {
		super();

		const forEachHandle = (func: (handle: Handles) => void) => {
			func(handles.Scale.XHandles);
			func(handles.Scale.YHandles);
			func(handles.Scale.ZHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		let bb = BB.fromPart(handles);

		let centerBased = false;
		let sameSize = false;

		const sizeMin = 0;
		const sizeMax = 8;

		const localSizeToGlobal = (center: CFrame, size: Vector3): Vector3 =>
			center.Rotation.PointToWorldSpace(size).Abs();
		const globalSizeToLocal = (center: CFrame, size: Vector3): Vector3 =>
			center.Rotation.Inverse().PointToWorldSpace(size).Abs();

		const update = (face: Enum.NormalId, distance: number): void => {
			const negative =
				face === Enum.NormalId.Front || face === Enum.NormalId.Bottom || face === Enum.NormalId.Left;

			const globalNormal = Vector3.FromNormalId(face);
			const localNormal = bb.center.Rotation.PointToObjectSpace(globalNormal);

			const localPivot = centerBased //
				? Vector3.zero
				: localNormal.mul(bb.originalSize.div(-2));

			const distanceMul = (1 - localPivot.div(bb.originalSize).Abs().findMax()) * 2;

			const gn = sameSize //
				? bb.originalSize.Unit
				: globalNormal.mul(negative ? -1 : 1);
			handles.Size = bb.originalSize.add(gn.mul(distance * distanceMul));

			handles.PivotTo(
				bb.center.ToWorldSpace(
					new CFrame(localPivot.add(localPivot.apply(math.sign).mul(handles.Size.div(-2)))),
				),
			);
			reposition(blocks, originalBB, BB.fromPart(handles));
		};

		let currentMovement: { readonly face: Enum.NormalId; distance: number } | undefined;
		const updateFromCurrentMovement = (): void => {
			if (!currentMovement) return;
			update(currentMovement.face, currentMovement.distance);
		};

		this.event.subInput((ih) => {
			ih.onKeyDown("LeftControl", () => {
				centerBased = true;
				updateFromCurrentMovement();
			});
			ih.onKeyUp("LeftControl", () => {
				centerBased = false;
				updateFromCurrentMovement();
			});

			ih.onKeyDown("LeftShift", () => {
				sameSize = true;
				updateFromCurrentMovement();
			});
			ih.onKeyUp("LeftShift", () => {
				sameSize = false;
				updateFromCurrentMovement();
			});
		});

		forEachHandle((handle) => {
			this.event.subscribe(handle.MouseDrag, (face, distance) => {
				currentMovement ??= { face, distance };
				currentMovement.distance = distance;

				updateFromCurrentMovement();
			});

			this.event.subscribe(handle.MouseButton1Up, () => {
				currentMovement = undefined;

				bb = BB.fromPart(handles);
				reposition(blocks, originalBB, bb);
			});
		});
	}
}

//

type BlockEditorControlDefinition = GuiObject & {
	readonly MoveButton: GuiButton;
	readonly RotateButton: GuiButton;
	readonly ScaleButton: GuiButton;
};
class BlockEditorControl extends Control<BlockEditorControlDefinition> {
	constructor(
		gui: BlockEditorControlDefinition,
		currentMode: ReadonlyObservableValue<EditMode>,
		set: (type: EditMode) => void,
	) {
		super(gui);

		const move = this.add(new ButtonControl(gui.MoveButton, () => set("move")));
		const rotate = this.add(new ButtonControl(gui.RotateButton, () => set("rotate")));
		const scale = this.add(new ButtonControl(gui.ScaleButton, () => set("scale")));

		const buttons = { move, rotate, scale };
		this.event.subscribeObservable(
			currentMode,
			(mode) => {
				for (const [name, button] of pairs(buttons)) {
					button.instance.BackgroundColor3 = mode === name ? Colors.accentDark : Colors.staticBackground;
				}
			},
			true,
		);
	}
}

@injectable
export class BlockEditor extends ClientComponent {
	private readonly _completed = new ArgsSignal();
	readonly completed = this._completed.asReadonly();

	private readonly editBlocks: readonly EditingBlock[];
	private readonly currentMode: ObservableValue<EditMode>;

	readonly step = new ObservableValue<number>(1);

	constructor(
		blocks: readonly BlockModel[],
		startMode: EditMode,
		@inject keybinds: Keybinds,
		@inject blockList: BlockList,
		@inject di: DIContainer,
	) {
		super();
		this.currentMode = new ObservableValue<EditMode>(startMode);

		this.editBlocks = blocks.map((b): EditingBlock => {
			const origModel = blockList.blocks[BlockManager.manager.id.get(b)]!.model;
			const scale = b.PrimaryPart!.Size.div(origModel.PrimaryPart!.Size);

			return {
				block: b,
				origModel,
				origLocation: b.GetPivot(),
				origScale: scale,
			};
		});

		const handles = Instances.getAssets<{ EditHandles: EditHandles }>().EditHandles.Clone();
		handles.Parent = Gui.getPlayerGui();
		ComponentInstance.init(this, handles);

		handles.Move.XHandles.Visible = handles.Move.YHandles.Visible = handles.Move.ZHandles.Visible = false;
		handles.Scale.XHandles.Visible = handles.Scale.YHandles.Visible = handles.Scale.ZHandles.Visible = false;
		handles.Rotate.ArcHandles.Visible = false;

		const bb = BB.fromModels(blocks);
		handles.PivotTo(bb.center);
		handles.Size = bb.originalSize;

		const modes: { readonly [k in EditMode]: () => Component } = {
			move: () => di.resolveForeignClass(MoveComponent, [handles, this.editBlocks, bb]),
			rotate: () => di.resolveForeignClass(RotateComponent, [handles, this.editBlocks, bb]),
			scale: () => di.resolveForeignClass(ScaleComponent, [handles, this.editBlocks, bb]),
		};

		const container = new ComponentChild(this);
		this.event.subscribeObservable(this.currentMode, (mode) => container.set(modes[mode]()), true);

		//

		const setModeByKey = (mode: EditMode) => {
			if (this.currentMode.get() === mode) {
				this._completed.Fire();
				return Enum.ContextActionResult.Sink;
			}

			this.currentMode.set(mode);
			return Enum.ContextActionResult.Sink;
		};

		const move = keybinds.get("edit_move");
		this.event.subscribeRegistration(() => move.onDown(() => setModeByKey("move"), -1));

		const rotate = keybinds.get("edit_rotate");
		this.event.subscribeRegistration(() => rotate.onDown(() => setModeByKey("rotate"), -1));

		const scale = keybinds.get("edit_scale");
		this.event.subscribeRegistration(() => scale.onDown(() => setModeByKey("scale"), -1));

		const gui = ToolBase.getToolGui<"Edit", GuiObject & { EditBottom: BlockEditorControlDefinition }>().Edit;
		const control = this.parentGui(new BlockEditorControl(gui.EditBottom.Clone(), this.currentMode, setModeByKey));
		control.instance.Parent = gui;
	}

	getUpdate(): readonly ClientBuilding.EditBlockInfo[] {
		return this.editBlocks.map(
			(b): ClientBuilding.EditBlockInfo => ({
				instance: b.block,
				origPosition: b.origLocation,
				newPosition: b.block.GetPivot(),
				origScale: b.origScale,
				newScale: b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size),
			}),
		);
	}

	cancel() {
		for (const { block, origModel, origLocation, origScale } of this.editBlocks) {
			repositionOne(block, origModel, origLocation, origScale);
		}
	}
}
