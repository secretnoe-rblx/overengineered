import { RunService, UserInputService, Workspace } from "@rbxts/services";
import { Tooltip } from "client/gui/controls/Tooltip";
import { DebugLog } from "client/gui/DebugLog";
import { Interface } from "client/gui/Interface";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { Keybinds } from "client/Keybinds";
import { FloatingText } from "client/tools/additional/FloatingText";
import { MoveGrid, ScaleGrid } from "client/tools/additional/Grid";
import { RotateGrid } from "client/tools/additional/Grid";
import { ToolBase } from "client/tools/ToolBase";
import { ButtonControl } from "engine/client/gui/Button";
import { Control, Control2 } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { TransformService } from "engine/shared/component/TransformService";
import { Element } from "engine/shared/Element";
import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { BB } from "engine/shared/fixes/BB";
import { Instances } from "engine/shared/fixes/Instances";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Colors } from "shared/Colors";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { TextButtonDefinition } from "engine/client/gui/Button";

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

class HandleMovementController extends Component {
	constructor(
		handle: Handles,
		sideways: ReadonlyObservableValue<boolean>,
		update: (delta: Vector3, face: Enum.NormalId) => void,
		release: () => void,
	) {
		super();

		const findRayPlaneIntersection = (
			rayOrigin: Vector3,
			rayDirection: Vector3,
			planeOrigin: Vector3,
			planeNormal: Vector3,
		): Vector3 | undefined => {
			const denominator = rayDirection.Dot(planeNormal);
			if (math.abs(denominator) < 1e-6) {
				return undefined;
			}

			const rayToPlane = planeOrigin.sub(rayOrigin);
			const t = rayToPlane.Dot(planeNormal) / denominator;
			if (t < 0) {
				return undefined;
			}

			return rayOrigin.add(rayDirection.mul(t));
		};
		const calculateCursorDeltaVecOnPlane = (arrowPosition: Vector3, arrowDirection: Vector3): (() => Vector3) => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return () => Vector3.zero;

			const mouseLocation = UserInputService.GetMouseLocation();
			const mouseRay = camera.ScreenPointToRay(mouseLocation.X, mouseLocation.Y);
			const startingMouseRay = mouseRay;

			const startingPosition = findRayPlaneIntersection(
				mouseRay.Origin,
				mouseRay.Direction,
				arrowPosition,
				mouseRay.Direction,
			);
			if (!startingPosition) return () => Vector3.zero;

			return () => {
				const camera = Workspace.CurrentCamera;
				if (!camera) return Vector3.zero;

				const mouseLocation = UserInputService.GetMouseLocation();
				const mouseRay = camera.ScreenPointToRay(mouseLocation.X, mouseLocation.Y);

				if (sideways.get()) {
					const point = findRayPlaneIntersection(
						mouseRay.Origin,
						mouseRay.Direction,
						startingPosition,
						arrowDirection,
					);
					if (!point) return Vector3.zero;

					return point.sub(startingPosition);
				}

				const point = findRayPlaneIntersection(
					mouseRay.Origin,
					mouseRay.Direction,
					startingPosition,
					startingMouseRay.Direction,
				);
				if (!point) return Vector3.zero;

				const diff = point.sub(startingPosition);
				const rotatedDiff = CFrame.lookAt(Vector3.zero, arrowDirection).PointToObjectSpace(diff);

				return arrowDirection.mul(-rotatedDiff.Z);
			};
		};

		let f: Enum.NormalId | undefined;
		let cu: (() => Vector3) | undefined;
		const upd = () => {
			if (!cu || !f) return;
			update(cu(), f);
		};
		this.event.subscribe(RunService.Heartbeat, upd);
		this.event.subscribeObservable(sideways, upd);

		this.event.subscribe(handle.MouseButton1Down, (face) => {
			if (!handle.Adornee) return;

			f = face;
			cu = calculateCursorDeltaVecOnPlane(
				handle.Adornee.Position,
				handle.Adornee.CFrame.VectorToWorldSpace(Vector3.FromNormalId(face)),
			);
		});
		this.event.subscribe(handle.MouseButton1Up, () => {
			cu = undefined;
			f = undefined;
			release();
		});
	}
}

type EditMode = "move" | "rotate" | "scale";

const repositionOne = (block: BlockModel, origModel: BlockModel, location: CFrame, scale: Vector3) => {
	block.PivotTo(location);
	SharedBuilding.scale(block, origModel, scale);
};
const almostSame = (left: number, right: number) => math.abs(left - right) < 0.0001;
const reposition = (blocks: readonly EditingBlock[], originalBB: BB, currentBB: BB) => {
	const scalediff = currentBB.originalSize.div(originalBB.originalSize);

	for (const { block, origModel, origLocation, origScale } of blocks) {
		const localToOriginalLocation = originalBB.center.ToObjectSpace(origLocation);

		const newloc = currentBB.center.ToWorldSpace(
			localToOriginalLocation.Rotation.add(localToOriginalLocation.Position.mul(scalediff)),
		);

		let newscale: Vector3;
		if (almostSame(scalediff.X, scalediff.Y) && almostSame(scalediff.Y, scalediff.Z)) {
			newscale = origScale.mul(scalediff.X);
		} else {
			newscale = origScale.mul(
				originalBB.center.ToObjectSpace(origLocation).Rotation.PointToObjectSpace(scalediff).Abs(),
			);
		}

		repositionOne(block, origModel, newloc, newscale);
	}
};

interface EditComponent extends Component {
	readonly error?: ReadonlyObservableValue<string | undefined>;
}

const centerBasedKb = Keybinds.registerDefinition(
	"edit_scale_centerBased",
	["Edit Tool", "Scale", "Scale from the center"],
	["LeftAlt"],
);
const sameSizeKb = Keybinds.registerDefinition(
	"edit_scale_sameSize",
	["Edit Tool", "Scale", "Uniform scaling"],
	["LeftShift"],
);
const sidewaysKb = Keybinds.registerDefinition(
	"edit_move_sideways",
	["Edit Tool", "Move", "Sideways movement"],
	["LeftAlt"],
);

const formatVecForFloatingText = (vec: Vector3): string => {
	const format = (num: number): string => {
		const str = Strings.prettyNumber(num, 0.01);
		if (num > 0) return `+${str}`;

		return `${str}`;
	};

	return `${format(vec.X)}, ${format(vec.Y)}, ${format(vec.Z)}`;
};

// #region Move
// #endregion
@injectable
class MoveComponent extends Component implements EditComponent {
	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		grid: ReadonlyObservableValue<MoveGrid>,
		topControl: BlockEditorTopControl,
		@inject keybinds: Keybinds,
	) {
		super();

		const forEachHandle = (func: (handle: Handles) => void) => {
			func(handles.Move.XHandles);
			func(handles.Move.YHandles);
			func(handles.Move.ZHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));

		const sideways = new ObservableSwitch(false);
		let bb = BB.fromPart(handles);

		const floatingText = this.parent(FloatingText.create(handles));
		const startbb = bb;
		const updateFloatingText = () =>
			floatingText.text.set(formatVecForFloatingText(handles.Position.sub(startbb.center.Position)));
		updateFloatingText();

		const update = (delta: Vector3) => {
			delta = grid.get().constrain(handles.GetPivot(), delta);

			handles.PivotTo(bb.center.add(delta));
			reposition(blocks, originalBB, BB.fromPart(handles));

			updateFloatingText();
		};

		let currentMovement: Vector3 | undefined;
		const updateFromCurrentMovement = (): void => {
			if (!currentMovement) return;
			update(currentMovement);
		};

		this.event.subscribeObservable(grid, updateFromCurrentMovement);

		// #region Keyboard controls initialization
		const tooltips = this.parent(TooltipsHolder.createComponent("Edit Tool > Move"));
		tooltips.setFromKeybinds(keybinds, sidewaysKb);

		this.event.subscribeObservable(keybinds.fromDefinition(sidewaysKb).isPressed, (value) => {
			sideways.set("kb", value);
			updateFromCurrentMovement();
		});
		// #endregion

		const createVisualizer = () => {
			const instance = Instances.getAssets<{
				MovementVisualizer: BasePart & { Decal: Decal };
			}>().MovementVisualizer.Clone();
			instance.Decal.Transparency = 1;

			const size = 500;
			instance.Size = new Vector3(0, size, size);

			ComponentInstance.init(this, instance);
			instance.Parent = Workspace;

			let visible = false;

			const props = {
				...TransformService.commonProps.quadOut02,
				duration: 0.5,
			};

			const update = (direction: Vector3, position: Vector3) => {
				if (!sideways.get()) {
					stop();
					return;
				}

				if (!visible) {
					visible = true;

					TransformService.cancel(instance);
					TransformService.run(instance.Decal, (tr) =>
						tr.transform(instance.Decal, "Transparency", 0.95, props),
					);
				}

				instance.CFrame = CFrame.lookAt(Vector3.zero, direction)
					.mul(CFrame.Angles(0, math.rad(90), 0))
					.add(position);
			};

			const stop = () => {
				if (!visible) return;
				visible = false;

				TransformService.cancel(instance);
				TransformService.run(instance.Decal, (tr) => tr.transform(instance.Decal, "Transparency", 1, props));
			};

			return { update, stop };
		};
		const visualizer = createVisualizer();

		forEachHandle((handle) => {
			this.parent(
				new HandleMovementController(
					handle,
					sideways,
					(delta, face) => {
						currentMovement = delta;
						updateFromCurrentMovement();
						visualizer.update(
							bb.center.Rotation.mul(Vector3.FromNormalId(face)),
							bb.center.Position.add(delta),
						);
					},
					() => {
						currentMovement = undefined;

						bb = BB.fromPart(handles);
						reposition(blocks, originalBB, bb);
						visualizer.stop();
					},
				),
			);
		});

		const sidewaysBtn = topControl.create("SIDEWAYS", () => sideways.set("kb", !sideways.get()));
		ComponentInstance.init(this, sidewaysBtn.instance);
		this.event.subscribeObservable(
			sideways,
			(sideways) => (sidewaysBtn.instance.Transparency = sideways ? 0 : 0.5),
			true,
		);
	}
}

// #region Rotate
// #endregion
@injectable
class RotateComponent extends Component implements EditComponent {
	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		grid: ReadonlyObservableValue<RotateGrid>,
		topControl: BlockEditorTopControl,
	) {
		super();

		const forEachHandle = (func: (handle: ArcHandles) => void) => {
			func(handles.Rotate.ArcHandles);
		};

		this.onEnabledStateChange((enabled) => forEachHandle((handle) => (handle.Visible = enabled)));
		this.onEnable(() => (handles.Rotate.Center.Size = handles.Size));

		let bb = BB.fromPart(handles);

		const floatingText = this.parent(FloatingText.create(handles));
		const startbb = bb;
		const updateFloatingText = () => {
			const [x, y, z] = handles.CFrame.Rotation.ToObjectSpace(startbb.center.Rotation).ToOrientation();
			const vec = new Vector3(x, y, z).apply(math.deg);
			floatingText.text.set(formatVecForFloatingText(vec));
		};
		updateFloatingText();

		const update = (axis: Enum.Axis, relativeAngle: number) => {
			const roundedRelativeAngle = grid.get().constrain(relativeAngle);
			handles.PivotTo(bb.center.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), roundedRelativeAngle)));
			handles.Rotate.Center.PivotTo(bb.center.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), relativeAngle)));

			reposition(blocks, originalBB, BB.fromPart(handles));
			updateFloatingText();
		};

		let currentRotation: { readonly axis: Enum.Axis; relativeAngle: number } | undefined;
		const updateFromCurrentRotation = (): void => {
			if (!currentRotation) return;
			update(currentRotation.axis, currentRotation.relativeAngle);
		};

		this.event.subscribeObservable(grid, updateFromCurrentRotation);

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

// #region Scale
// #endregion
@injectable
class ScaleComponent extends Component implements EditComponent {
	readonly error = new ObservableValue<string | undefined>(undefined);

	constructor(
		handles: EditHandles,
		blocks: readonly EditingBlock[],
		originalBB: BB,
		grid: ReadonlyObservableValue<ScaleGrid>,
		topControl: BlockEditorTopControl,
		@inject keybinds: Keybinds,
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

		const floatingText = this.parent(FloatingText.create(handles));
		const startbb = bb;
		const updateFloatingText = () =>
			floatingText.text.set(formatVecForFloatingText(handles.Size.sub(startbb.originalSize)));
		updateFloatingText();

		const calculatePivotPosition = (face: Enum.NormalId): Vector3 => {
			const globalNormal = Vector3.FromNormalId(face);

			return centerBased.get() //
				? Vector3.zero
				: globalNormal.mul(bb.originalSize.div(-2));
		};
		const update = (face: Enum.NormalId, distance: number): void => {
			const negative =
				face === Enum.NormalId.Front || face === Enum.NormalId.Bottom || face === Enum.NormalId.Left;

			const globalNormal = Vector3.FromNormalId(face);
			const localPivot = calculatePivotPosition(face);
			pivot.Position = bb.center.PointToWorldSpace(localPivot);

			const distanceMul = (1 - localPivot.div(bb.originalSize).Abs().findMax()) * 2;

			const makeUnitWithAxis1 = (vector: Vector3, direction: Vector3) => {
				let axisValue = 0;
				if (direction.X !== 0) axisValue = vector.X;
				else if (direction.Y !== 0) axisValue = vector.Y;
				else if (direction.Z !== 0) axisValue = vector.Z;

				return vector.div(axisValue);
			};

			const gn = sameSize.get() //
				? makeUnitWithAxis1(bb.originalSize, globalNormal)
				: globalNormal.mul(negative ? -1 : 1);
			let g = gn.mul(distance * distanceMul);
			DebugLog.category("gb", { g });
			g = grid.get().constrain(globalNormal, handles.GetPivot(), g);
			DebugLog.category("ga", { g });

			handles.Size = bb.originalSize.add(g);
			updateFloatingText();

			handles.PivotTo(
				bb.center.ToWorldSpace(
					new CFrame(localPivot.add(localPivot.apply(math.sign).mul(handles.Size.div(-2)))),
				),
			);
			reposition(blocks, originalBB, BB.fromPart(handles));

			const overscaled = blocks.any(
				(b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).findMax() > 8,
			);
			if (overscaled) {
				this.error.set("Some blocks are scaled too big (maximum is 8x)");
			} else {
				const underscaled = blocks.any(
					(b) => b.block.PrimaryPart!.Size.div(b.origModel.PrimaryPart!.Size).findMin() < 1 / 16,
				);
				if (underscaled) {
					this.error.set("Some blocks are scaled too small (minimum is 1/16x)");
				} else {
					this.error.set(undefined);
				}
			}
		};

		let currentMovement: { readonly face: Enum.NormalId; distance: number } | undefined;
		const updateFromCurrentMovement = (): void => {
			if (!currentMovement) return;
			update(currentMovement.face, currentMovement.distance);
		};

		this.event.subscribeObservable(grid, updateFromCurrentMovement);

		// #region Keyboard controls initialization
		const tooltips = this.parent(TooltipsHolder.createComponent("Edit Tool > Scale"));
		tooltips.setFromKeybinds(keybinds, centerBasedKb, sameSizeKb);

		this.event.subscribeObservable(keybinds.fromDefinition(centerBasedKb).isPressed, (value) => {
			centerBased.set("kb", value);
			updateFromCurrentMovement();
		});
		this.event.subscribeObservable(keybinds.fromDefinition(sameSizeKb).isPressed, (value) => {
			sameSize.set("kb", value);
			updateFromCurrentMovement();
		});
		// #endregion

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
			});
		});

		const centerBasedBtn = topControl.create("CENTERED", () => centerBased.set("kb", !centerBased.get()));
		ComponentInstance.init(this, centerBasedBtn.instance);
		this.event.subscribeObservable(
			centerBased,
			(centerBased) => (centerBasedBtn.instance.Transparency = centerBased ? 0 : 0.5),
			true,
		);

		const sameSizeBtn = topControl.create("UNIFORM", () => sameSize.set("kb", !sameSize.get()));
		ComponentInstance.init(this, sameSizeBtn.instance);
		this.event.subscribeObservable(
			sameSize,
			(sameSize) => (sameSizeBtn.instance.Transparency = sameSize ? 0 : 0.5),
			true,
		);
		const sameSizeErr = this.parent(new ControlWithError(sameSizeBtn.instance));

		// #region Block rotation check
		const areRotations90DegreesApart = (cframeA: CFrame, cframeB: CFrame): boolean => {
			const rotationDifference = cframeA.ToObjectSpace(cframeB);
			const [_1, _2, _3, m00, m01, m02, m10, m11, m12, m20, m21, m22] = rotationDifference.GetComponents();

			const is90DegreeMultiple = (value: number): boolean => {
				const degrees = math.deg(math.acos(math.clamp(value, 0, 1)));
				print("q", value, degrees);
				return math.abs(degrees % 90) < 0.1 || math.abs((degrees % 90) - 90) < 0.1;
			};
			return is90DegreeMultiple(m00) && is90DegreeMultiple(m11) && is90DegreeMultiple(m22);
		};

		if (blocks.any((b) => !areRotations90DegreesApart(bb.center, b.block.GetPivot()))) {
			sameSize.set("multipleBlocks", true);
			sameSizeErr.setError(
				"Uniform scaling is forced because the selection has blocks with non-aligned rotations.",
			);
		}
		// #endregion
	}
}

//

type BlockEditorControlBottomDefinition = GuiObject & {
	readonly MoveButton: GuiButton;
	readonly RotateButton: GuiButton;
	readonly ScaleButton: GuiButton;
	readonly CompleteButton: GuiButton;
};
class BlockEditorBottomControl extends Control<BlockEditorControlBottomDefinition> {
	constructor(
		gui: BlockEditorControlBottomDefinition,
		currentMode: ReadonlyObservableValue<EditMode>,
		set: (type: EditMode) => void,
		commit: () => void,
	) {
		super(gui);

		const move = this.parent(new Control2(gui.MoveButton)).withButtonAction(() => set("move"));
		const rotate = this.parent(new Control2(gui.RotateButton)).withButtonAction(() => set("rotate"));
		const scale = this.parent(new Control2(gui.ScaleButton)).withButtonAction(() => set("scale"));

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

type ControlWithErrorDefinition = GuiObject & {
	readonly WarningImage: ImageLabel;
};
class ControlWithError extends InstanceComponent<ControlWithErrorDefinition> {
	private tooltip?: SignalConnection;

	constructor(gui: ControlWithErrorDefinition) {
		super(gui);

		gui.WarningImage.Visible = false;
		this.onDisable(() => this.tooltip?.Disconnect());
	}

	setError(err: string | undefined) {
		this.instance.WarningImage.Visible = err !== undefined;
		this.tooltip?.Disconnect();

		if (err) {
			this.tooltip = Tooltip.init(this, err);
		}
	}
}

type BlockEditorTopControlDefinition = GuiObject & {
	readonly Template: TextButtonDefinition & {
		readonly WarningImage: ImageLabel;
	};
};
class BlockEditorTopControl extends Control<BlockEditorTopControlDefinition> {
	private readonly template;

	constructor(gui: BlockEditorTopControlDefinition) {
		super(gui);
		this.template = this.asTemplate(gui.Template, true);
	}

	create(text: string, activated?: () => void): Control2<BlockEditorTopControlDefinition["Template"]> {
		const btn = this.add(new Control2(this.template()));

		if (activated) {
			btn.withButtonAction(activated);
		}

		btn.setButtonText(text);
		btn.instance.WarningImage.Visible = false;

		return btn;
	}
}

class CompoundObservableSet<T extends defined> {
	readonly set = new ObservableCollectionSet<T>();

	addSource(observable: ReadonlyObservableValue<T | undefined>) {
		observable.subscribe((value, prev) => {
			if (value !== undefined) {
				this.set.add(value);
			} else if (prev !== undefined) {
				this.set.remove(prev);
			}
		});
	}
}

@injectable
export class BlockEditor extends Component {
	private readonly _completed = new ArgsSignal();
	readonly completed = this._completed.asReadonly();

	private readonly editBlocks: readonly EditingBlock[];
	private readonly currentMode: ObservableValue<EditMode>;

	private readonly moveGrid = new ObservableValue(MoveGrid.def);
	private readonly rotateGrid = new ObservableValue(RotateGrid.def);
	private readonly scaleGrid = new ObservableValue(ScaleGrid.def);
	private _errors = new CompoundObservableSet<string>();
	readonly errors = this._errors.set.asReadonly();

	constructor(
		blocks: readonly BlockModel[],
		startMode: EditMode,
		bounds: BB,
		editMode: "global" | "local",
		@inject keybinds: Keybinds,
		@inject blockList: BlockList,
		@inject playerData: PlayerDataStorage,
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
		handles.Parent = Interface.getPlayerGui();
		ComponentInstance.init(this, handles);

		this.event.subscribeObservable(
			playerData.config,
			(config) => {
				const visuals = config.visuals.multiSelection;
				const sb = handles.SelectionBox;

				sb.Color3 = visuals.borderColor;
				sb.Transparency = visuals.borderTransparency;
				sb.LineThickness = visuals.borderThickness;

				sb.SurfaceColor3 = visuals.surfaceColor;
				sb.SurfaceTransparency = visuals.surfaceTransparency;
			},
			true,
		);

		const inBoundsError = new ObservableValue<string | undefined>(undefined);
		this._errors.addSource(inBoundsError);
		const updateHandlesInBounds = () => {
			if (bounds.isBBInside(BB.fromPart(handles))) {
				inBoundsError.set(undefined);
			} else {
				inBoundsError.set("Out of bounds");
			}
		};
		this.event.readonlyObservableFromInstanceParam(handles, "CFrame").subscribe(updateHandlesInBounds);
		this.event.readonlyObservableFromInstanceParam(handles, "Size").subscribe(updateHandlesInBounds);

		const errIndicator = Element.create("SelectionBox", {
			Color3: Colors.red,
			SurfaceColor3: Colors.red,
			Transparency: 1,
			SurfaceTransparency: 1,
			Adornee: handles,
			Parent: handles,
		});
		this.event.subscribe(this.errors.collectionChanged, () => {
			const valid = this.errors.size() === 0;

			const props = {
				...TransformService.commonProps.quadOut02,
				duration: valid ? 0.5 : 0.1,
			};

			TransformService.run(errIndicator, (tr) =>
				tr
					.transform(errIndicator, "Transparency", valid ? 1 : 0, props)
					.transform(errIndicator, "SurfaceTransparency", valid ? 1 : 0.3, props),
			);
		});

		let prevCameraState: Enum.CameraType | undefined;
		const releaseCamera = () => {
			if (!prevCameraState) return;

			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			camera.CameraType = prevCameraState;
			prevCameraState = undefined;
		};
		this.onDisable(releaseCamera);

		const initializeHandles = (handles: Handles | ArcHandles) => {
			handles.Visible = false;

			this.event.subscribeObservable(
				this.event.readonlyObservableFromInstanceParam(handles, "Visible"),
				(visible) => {
					if (!visible) {
						releaseCamera();
					}
				},
			);

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
					handles.MouseButton1Up.Connect(releaseCamera),
				];
			});
			this.event.subInput((ih) => {
				ih.onInputEnded((b) => {
					if (b.UserInputType !== Enum.UserInputType.Touch) return;
					releaseCamera();
				});
			});
		};
		initializeHandles(handles.Move.XHandles);
		initializeHandles(handles.Move.YHandles);
		initializeHandles(handles.Move.ZHandles);
		initializeHandles(handles.Scale.XHandles);
		initializeHandles(handles.Scale.YHandles);
		initializeHandles(handles.Scale.ZHandles);
		initializeHandles(handles.Rotate.ArcHandles);

		const setModeByKey = (mode: EditMode) => {
			if (this.currentMode.get() === mode) {
				this._completed.Fire();
				return Enum.ContextActionResult.Sink;
			}

			this.currentMode.set(mode);
			return Enum.ContextActionResult.Sink;
		};

		// #region
		const gui = ToolBase.getToolGui<
			"Edit2",
			GuiObject & {
				readonly EditBottom: BlockEditorControlBottomDefinition;
				readonly EditTop: BlockEditorTopControlDefinition;
			}
		>().Edit2;
		const bottomControl = this.parentGui(
			new BlockEditorBottomControl(gui.EditBottom.Clone(), this.currentMode, setModeByKey, () =>
				this._completed.Fire(),
			),
		);
		bottomControl.instance.Parent = gui;

		const topControl = this.parentGui(new BlockEditorTopControl(gui.EditTop.Clone()));
		topControl.instance.Parent = gui;
		// #endregion

		const bb = BB.fromModels(blocks, editMode === "global" ? CFrame.identity : undefined);
		handles.PivotTo(bb.center);
		handles.Size = bb.originalSize;

		const modes: { readonly [k in EditMode]: () => Component } = {
			move: () =>
				di.resolveForeignClass(MoveComponent, [handles, this.editBlocks, bb, this.moveGrid, topControl]),
			rotate: () =>
				di.resolveForeignClass(RotateComponent, [handles, this.editBlocks, bb, this.rotateGrid, topControl]),
			scale: () =>
				di.resolveForeignClass(ScaleComponent, [handles, this.editBlocks, bb, this.scaleGrid, topControl]),
		};

		const container = this.parent(new ComponentChild<EditComponent>());
		container.childSet.Connect((child) => {
			if (!child?.error) return;
			this._errors.addSource(child.error);
		});
		this.event.subscribeObservable(this.currentMode, (mode) => container.set(modes[mode]()), true);

		//

		const move = keybinds.get("edit_move");
		this.event.subscribeRegistration(() => move.onDown(() => setModeByKey("move"), -1));

		const rotate = keybinds.get("edit_rotate");
		this.event.subscribeRegistration(() => rotate.onDown(() => setModeByKey("rotate"), -1));

		const scale = keybinds.get("edit_scale");
		this.event.subscribeRegistration(() => scale.onDown(() => setModeByKey("scale"), -1));
	}

	initializeGrids(grids: {
		readonly moveGrid: ReadonlyObservableValue<number>;
		readonly rotateGrid: ReadonlyObservableValue<number>;
		readonly scaleGrid: ReadonlyObservableValue<number>;
	}) {
		this.event.subscribeObservable(grids.moveGrid, (grid) => this.moveGrid.set(MoveGrid.normal(grid)), true);
		this.event.subscribeObservable(
			grids.rotateGrid,
			(grid) => this.rotateGrid.set(RotateGrid.normal(math.rad(grid))),
			true,
		);
		this.event.subscribeObservable(grids.scaleGrid, (grid) => this.scaleGrid.set(ScaleGrid.normal(grid)), true);
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
