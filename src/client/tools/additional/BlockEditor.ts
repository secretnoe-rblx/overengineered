import { Workspace } from "@rbxts/services";
import { Gui } from "client/gui/Gui";
import { ToolBase } from "client/tools/ToolBase";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Element } from "engine/shared/Element";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { BB } from "engine/shared/fixes/BB";
import { Instances } from "engine/shared/fixes/Instances";
import { MathUtils } from "engine/shared/fixes/MathUtils";
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
	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		step: ReadonlyObservableValue<number>,
	) {
		super();

		const forEachHandle = (func: (handle: Handles) => void) => {
			func(handles.Move.XHandles);
			func(handles.Move.YHandles);
			func(handles.Move.ZHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		let bb = BB.fromPart(handles);
		const update = (face: Enum.NormalId, distance: number) => {
			distance = MathUtils.round(distance, step.get());

			const direction = bb.center.Rotation.mul(Vector3.FromNormalId(face));
			const diff = direction.mul(distance);
			handles.PivotTo(bb.center.add(diff));

			reposition(blocks, originalBB, BB.fromPart(handles));
		};

		let currentMovement: { readonly face: Enum.NormalId; distance: number } | undefined;
		const updateFromCurrentMovement = (): void => {
			if (!currentMovement) return;
			update(currentMovement.face, currentMovement.distance);
		};

		this.event.subscribeObservable(step, updateFromCurrentMovement);

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

@injectable
class RotateComponent extends Component {
	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		step: ReadonlyObservableValue<number>,
	) {
		super();

		const forEachHandle = (func: (handle: ArcHandles) => void) => {
			func(handles.Rotate.ArcHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		const update = (axis: Enum.Axis, relativeAngle: number) => {
			const roundedRelativeAngle = MathUtils.round(relativeAngle, math.rad(step.get()));
			handles.PivotTo(bb.center.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), roundedRelativeAngle)));
			handles.Rotate.Center.PivotTo(bb.center.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), relativeAngle)));

			reposition(blocks, originalBB, BB.fromPart(handles));
		};

		let currentRotation: { readonly axis: Enum.Axis; relativeAngle: number } | undefined;
		const updateFromCurrentRotation = (): void => {
			if (!currentRotation) return;
			update(currentRotation.axis, currentRotation.relativeAngle);
		};

		this.event.subscribeObservable(step, updateFromCurrentRotation);

		let bb = BB.fromPart(handles);
		const sub = (handle: ArcHandles) => {
			this.event.subscribe(handle.MouseDrag, (axis, relativeAngle, deltaRadius) => {
				currentRotation ??= { axis, relativeAngle };
				currentRotation.relativeAngle = relativeAngle;

				updateFromCurrentRotation();
			});

			this.event.subscribe(handle.MouseButton1Up, () => {
				currentRotation = undefined;
				handles.Rotate.Center.PivotTo(handles.GetPivot());

				bb = BB.fromPart(handles);
				reposition(blocks, originalBB, bb);
			});
		};
		forEachHandle(sub);
	}
}

@injectable
class ScaleComponent extends ClientComponent {
	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		step: ReadonlyObservableValue<number>,
	) {
		super();

		const forEachHandle = (func: (handle: Handles) => void) => {
			func(handles.Scale.XHandles);
			func(handles.Scale.YHandles);
			func(handles.Scale.ZHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		let bb = BB.fromPart(handles);

		const centerBased = new ObservableSwitch(false);
		const sameSize = new ObservableSwitch(false);
		sameSize.set("multipleBlocks", blocks.size() > 1);

		const scaleMax = 4;
		let maxExistingBlockScales = new Vector3(
			blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).X).max() ?? 0,
			blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).Y).max() ?? 0,
			blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).Z).max() ?? 0,
		);
		let maxExistingBlockScale =
			blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).findMax()).max() ?? 0;

		const pivot = Element.create(
			"Part",
			{
				Anchored: true,
				Size: Vector3.one.mul(0.2),
				Color: Colors.white,
				Shape: Enum.PartType.Ball,
				Parent: Workspace,
			},
			{
				highlight: Element.create("Highlight", {
					FillColor: Colors.red,
					DepthMode: Enum.HighlightDepthMode.AlwaysOnTop,
				}),
			},
		);
		ComponentInstance.init(this, pivot);

		const calculatePivotPosition = (face: Enum.NormalId): Vector3 => {
			const globalNormal = Vector3.FromNormalId(face);

			return centerBased.get() //
				? Vector3.zero
				: globalNormal.mul(bb.originalSize.div(-2));
		};
		const update = (face: Enum.NormalId, distance: number): void => {
			distance = MathUtils.round(distance, step.get());

			const negative =
				face === Enum.NormalId.Front || face === Enum.NormalId.Bottom || face === Enum.NormalId.Left;

			const globalNormal = Vector3.FromNormalId(face);
			const localPivot = calculatePivotPosition(face);
			pivot.Position = bb.center.PointToWorldSpace(localPivot);

			const distanceMul = (1 - localPivot.div(bb.originalSize).Abs().findMax()) * 2;

			const gn = sameSize.get() //
				? bb.originalSize.Unit
				: globalNormal.mul(negative ? -1 : 1);
			const g = gn.mul(distance * distanceMul);

			// TODO: block size restriction

			const scaleDist = math.min(distance * distanceMul, (scaleMax - maxExistingBlockScale) * 2);
			handles.Size = bb.originalSize.add(g);

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

		this.event.subscribeObservable(step, updateFromCurrentMovement);

		this.event.subInput((ih) => {
			ih.onKeyDown("LeftAlt", () => {
				centerBased.set("kb", true);
				updateFromCurrentMovement();
			});
			ih.onKeyUp("LeftAlt", () => {
				centerBased.set("kb", false);
				updateFromCurrentMovement();
			});

			ih.onKeyDown("LeftShift", () => {
				sameSize.set("kb", true);
				updateFromCurrentMovement();
			});
			ih.onKeyUp("LeftShift", () => {
				sameSize.set("kb", false);
				updateFromCurrentMovement();
			});
		});

		forEachHandle((handle) => {
			this.event.subscribe(handle.MouseDrag, (face, distance) => {
				currentMovement ??= { face, distance };
				currentMovement.distance = distance;

				updateFromCurrentMovement();
			});

			this.event.subscribe(handle.MouseButton1Down, (face) => {
				pivot.Position = bb.center.PointToWorldSpace(calculatePivotPosition(face));
			});
			this.event.subscribe(handle.MouseButton1Up, () => {
				currentMovement = undefined;
				pivot.CFrame = CFrame.identity;

				bb = BB.fromPart(handles);
				reposition(blocks, originalBB, bb);
				maxExistingBlockScale =
					blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).findMax()).max() ??
					0;
				maxExistingBlockScales = new Vector3(
					blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).X).max() ?? 0,
					blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).Y).max() ?? 0,
					blocks.map((b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).Z).max() ?? 0,
				);
			});
		});
	}
}

//

type BlockEditorControlDefinition = GuiObject & {
	readonly MoveButton: GuiButton;
	readonly RotateButton: GuiButton;
	readonly ScaleButton: GuiButton;
	readonly CompleteButton: GuiButton;
};
class BlockEditorControl extends Control<BlockEditorControlDefinition> {
	constructor(
		gui: BlockEditorControlDefinition,
		currentMode: ReadonlyObservableValue<EditMode>,
		set: (type: EditMode) => void,
		commit: () => void,
	) {
		super(gui);

		const move = this.add(new ButtonControl(gui.MoveButton, () => set("move")));
		const rotate = this.add(new ButtonControl(gui.RotateButton, () => set("rotate")));
		const scale = this.add(new ButtonControl(gui.ScaleButton, () => set("scale")));
		this.add(new ButtonControl(gui.CompleteButton, commit));

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

	readonly moveStep = new ObservableValue<number>(1);
	readonly rotateStep = new ObservableValue<number>(90);

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

		let prevCameraState: Enum.CameraType | undefined;
		const initializeHandles = (handles: Handles | ArcHandles) => {
			handles.Visible = false;

			// disable camera on drag
			this.event.subscribeRegistration(() => {
				if (InputController.inputType.get() !== "Touch") {
					return;
				}

				return [
					handles.MouseButton1Down.Connect(() => {
						const camera = Workspace.CurrentCamera;
						if (!camera) return;

						prevCameraState = camera.CameraType;
						camera.CameraType = Enum.CameraType.Scriptable;
					}),
					handles.MouseButton1Up.Connect(() => {
						if (!prevCameraState) return;

						const camera = Workspace.CurrentCamera;
						if (!camera) return;

						camera.CameraType = prevCameraState;
						prevCameraState = undefined;
					}),
				];
			});
		};
		initializeHandles(handles.Move.XHandles);
		initializeHandles(handles.Move.YHandles);
		initializeHandles(handles.Move.ZHandles);
		initializeHandles(handles.Scale.XHandles);
		initializeHandles(handles.Scale.YHandles);
		initializeHandles(handles.Scale.ZHandles);
		initializeHandles(handles.Rotate.ArcHandles);

		const bb = BB.fromModels(blocks);
		handles.PivotTo(bb.center);
		handles.Size = bb.originalSize;

		const modes: { readonly [k in EditMode]: () => Component } = {
			move: () => di.resolveForeignClass(MoveComponent, [handles, this.editBlocks, bb, this.moveStep]),
			rotate: () => di.resolveForeignClass(RotateComponent, [handles, this.editBlocks, bb, this.rotateStep]),
			scale: () => di.resolveForeignClass(ScaleComponent, [handles, this.editBlocks, bb, this.moveStep]),
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

		const gui = ToolBase.getToolGui<"Edit2", GuiObject & { EditBottom: BlockEditorControlDefinition }>().Edit2;
		const control = this.parentGui(
			new BlockEditorControl(gui.EditBottom.Clone(), this.currentMode, setModeByKey, () =>
				this._completed.Fire(),
			),
		);
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
