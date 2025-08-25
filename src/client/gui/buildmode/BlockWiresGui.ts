import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { LogControl } from "client/gui/static/LogControl";
import { ServiceIntegrityChecker } from "client/integrity/ServiceIntegrityChecker";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { Colors } from "engine/shared/Colors";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Element } from "engine/shared/Element";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

const markerParent = Element.create("ScreenGui", {
	Name: "WireToolMarkers",
	ScreenInsets: Enum.ScreenInsets.None,
	IgnoreGuiInset: true,
	DisplayOrder: -1, // to draw behind the wires
	Parent: Interface.getPlayerGui(),
	ResetOnSpawn: false,
});
ServiceIntegrityChecker.whitelistInstance(markerParent);
const wireParent = Element.create("ViewportFrame", {
	Name: "WireViewportFrame",
	Size: UDim2.fromScale(1, 1),
	CurrentCamera: Workspace.CurrentCamera,
	Transparency: 1,
	Parent: markerParent,
	Ambient: Colors.white,
	LightColor: Colors.white,
	ZIndex: -1,
});

const looped = new Map<BlockWiresMarkers.Marker | WireComponent, (index: number) => void>();
task.spawn(() => {
	let loopindex = 0;
	while (true as boolean) {
		task.wait(0.5);

		loopindex++;
		for (const [_, value] of looped) {
			value(loopindex);
		}
	}
});

const getTypeColor = (wireType: keyof BlockLogicTypes.Primitives) => {
	const color = BlockWireManager.types[wireType]?.color;
	if (!color) {
		LogControl.instance.addLine("Some of your wires have incompatible types, fix before proceeding.", Colors.red);
		return Colors.purple;
	}

	return color;
};

export namespace BlockWiresMarkers {
	export type MarkerComponentDefinition = BillboardGui & {
		readonly TextButton: GuiButton & {
			readonly White: Frame;
			readonly Filled: Frame;
		};
	};
	export abstract class Marker extends InstanceComponent<MarkerComponentDefinition> {
		private static getPartMarkerPositions(originalOrigin: BasePart): Vector3[] {
			const sizeX = originalOrigin.Size.X / 2;
			const sizeY = originalOrigin.Size.Y / 2;
			const sizeZ = originalOrigin.Size.Z / 2;
			const offset = 0.25;

			return [
				new Vector3(-sizeX + offset, 0, 0),
				new Vector3(sizeX - offset, 0, 0),
				new Vector3(0, 0, -sizeZ + offset),
				new Vector3(0, 0, sizeZ - offset),
				new Vector3(0, -sizeY + offset, 0),
				new Vector3(0, sizeY - offset, 0),
				new Vector3(0, 0, 0),
			];
		}
		static createInstance(
			origin: BasePart,
			offset: Vector3 | number | "center",
			scale: Vector3 | undefined,
			originalOrigin: BasePart,
		): MarkerComponentDefinition {
			if (typeIs(offset, "number")) {
				offset = this.getPartMarkerPositions(originalOrigin)[offset];
			}
			if (offset === "center") {
				offset = Vector3.zero;
			}
			if (scale) {
				offset = offset.mul(scale);
			}

			const markerInstance = ReplicatedStorage.Assets.Wires.WireMarker.Clone();

			markerInstance.MaxDistance = 200;
			markerInstance.Adornee = origin;
			markerInstance.StudsOffsetWorldSpace = origin.CFrame.PointToObjectSpace(
				origin.CFrame.PointToWorldSpace(offset),
			);

			markerInstance.Parent = markerParent;
			return markerInstance;
		}

		readonly position;
		sameGroupMarkers?: readonly Marker[];
		protected pauseColors = false;
		protected readonly children;
		readonly tooltipsAlwaysVisible = new ObservableValue(false);

		constructor(
			readonly block: BlockModel,
			instance: MarkerComponentDefinition,
			readonly name: string,
			readonly availableTypes: ReadonlyObservableValue<readonly (keyof BlockLogicTypes.Primitives)[]>,
		) {
			super(instance);

			this.children = this.parent(new ComponentChildren().withParentInstance(instance));

			this.onEnable(() => (this.instance.Enabled = true));
			this.onDisable(() => (this.instance.Enabled = false));

			this.position = this.block.GetPivot().PointToWorldSpace(instance.StudsOffsetWorldSpace);

			this.initTooltips();
			this.initColors();
		}

		private initTooltips() {
			const tooltipParent = this.parent(
				new ComponentChild<Control<GuiObject & { WireInfoLabel: TextLabel; TypeTextLabel: TextLabel }>>(true),
			);
			const createTooltip = () => {
				const wireInfoSource = ReplicatedAssets.get<{
					Wires: { WireInfo: GuiObject & { WireInfoLabel: TextLabel; TypeTextLabel: TextLabel } };
				}>().Wires.WireInfo;
				const control = new Control(wireInfoSource.Clone());

				control.instance.WireInfoLabel.Text = this.name;
				control.instance.TypeTextLabel.Text = this.availableTypes.get().join("/");

				control.instance.Parent = this.instance;
				control.instance.AnchorPoint = new Vector2(0.5, 0.98); // can't set Y to 1 because then it doesn't render
				control.instance.Position = new UDim2(0.5, 0, 0, 0);
				control.instance.Size = new UDim2(2, 0, 1, 0);

				tooltipParent.set(control);
			};
			const removeTooltip = () => tooltipParent.clear();

			this.tooltipsAlwaysVisible.subscribe((alwaysVisible) => {
				if (alwaysVisible) {
					createTooltip();
				}
			}, true);
			this.event.onPrepare((inputType, eh) => {
				if (this.tooltipsAlwaysVisible.get()) {
					createTooltip();
					return;
				}

				if (inputType === "Desktop") {
					eh.subscribe(this.instance.TextButton.MouseEnter, createTooltip);
					eh.subscribe(this.instance.TextButton.MouseLeave, removeTooltip);
				} else if (inputType === "Touch") {
					createTooltip();
				} else if (inputType === "Gamepad") {
					eh.subscribe(this.instance.TextButton.MouseEnter, createTooltip);
					eh.subscribe(this.instance.TextButton.MouseLeave, removeTooltip);
				}

				if (inputType === "Gamepad") {
					this.instance.Size = new UDim2(
						this.instance.Size.X.Scale * 1.5,
						this.instance.Size.X.Offset * 1.5,
						this.instance.Size.Y.Scale * 1.5,
						this.instance.Size.Y.Offset * 1.5,
					);
				}
			});
		}
		private initColors() {
			let loop: (() => void) | undefined;

			this.onDestroy(() => loop?.());
			this.event.subscribeObservable(
				this.availableTypes,
				(types) => {
					loop?.();
					const setcolor = (color: Color3) => {
						this.instance.TextButton.BackgroundColor3 = color;
						this.instance.TextButton.Filled.BackgroundColor3 = color;
					};

					if (types.size() === 1) {
						setcolor(getTypeColor(types[0]));
					} else {
						const func = (index: number) => {
							if (this.pauseColors) return;
							setcolor(getTypeColor(types[index % types.size()]));
						};

						looped.set(this, func);
						loop = () => looped.delete(this);
					}
				},
				true,
				true,
			);
		}
	}

	export class Input extends Marker {
		private connected = false;

		constructor(
			blockInstance: BlockModel,
			gui: MarkerComponentDefinition,
			name: string,
			availableTypes: ReadonlyObservableValue<readonly (keyof BlockLogicTypes.Primitives)[]>,
		) {
			super(blockInstance, gui, name, availableTypes);
			this.instance.TextButton.White.Visible = true;
		}

		setConnectedTo(marker: Output | undefined) {
			this.updateConnectedVisual(marker !== undefined);
			this.children.clear();

			if (marker) {
				const wire = this.children.add(WireComponent.create(marker, this));
				wire.instance.Parent = wireParent;
			}
		}

		private updateConnectedVisual(connected: boolean) {
			this.connected = connected;
			this.instance.TextButton.Filled.Visible = connected;
		}

		isConnected() {
			return this.connected;
		}
	}
	export class Output extends Marker {
		constructor(
			blockInstance: BlockModel,
			gui: MarkerComponentDefinition,
			name: string,
			availableTypes: ReadonlyObservableValue<readonly (keyof BlockLogicTypes.Primitives)[]>,
		) {
			super(blockInstance, gui, name, availableTypes);

			this.instance.TextButton.White.Visible = false;
			this.instance.TextButton.Filled.Visible = false;
		}

		highlight() {
			this.pauseColors = true;
			this.instance.TextButton.BackgroundColor3 = Colors.red;
		}
		unhighlight() {
			this.pauseColors = false;
			this.instance.TextButton.BackgroundColor3 = getTypeColor(this.availableTypes.get()[0]);
		}

		hideWires() {
			for (const child of this.children.getAll()) {
				child.disable();
			}
		}
		enable() {
			// show hidden wires
			if (this.isEnabled()) {
				for (const child of this.children.getAll()) {
					child.enable();
				}
			}

			super.enable();
		}
	}
}

export type WireComponentDefinition = Part;
export class WireComponent extends InstanceComponent<WireComponentDefinition> {
	private static readonly visibleTransparency = 0.4;
	static createInstance(): WireComponentDefinition {
		return Element.create("Part", {
			Anchored: true,
			CanCollide: false,
			CanQuery: false,
			CanTouch: false,
			CastShadow: false,

			Material: Enum.Material.Neon,
			Transparency: this.visibleTransparency,
			Shape: Enum.PartType.Cylinder,
		});
	}
	static create(from: BlockWiresMarkers.Output, to: BlockWiresMarkers.Input): WireComponent {
		const wire = new WireComponent(this.createInstance(), from.position, to.position);
		wire.subColorsFromTypes(from.availableTypes);

		return wire;
	}

	private readonly colors;

	constructor(instance: WireComponentDefinition, from: Vector3, to: Vector3) {
		super(instance);
		this.colors = new ObservableValue<readonly Color3[]>([Colors.white]);

		this.onEnable(() => (this.instance.Transparency = WireComponent.visibleTransparency));
		this.onDisable(() => (this.instance.Transparency = 1));

		let loop: (() => void) | undefined;
		this.onDestroy(() => loop?.());
		this.event.subscribeObservable(
			this.colors,
			(colors) => {
				loop?.();
				const set = (color: Color3) => (this.instance.Color = color);

				if (colors.size() === 1) {
					set(colors[0]);
				} else {
					const func = (index: number) => set(colors[index % (colors.size() === 0 ? 1 : colors.size())]);

					looped.set(this, func);
					loop = () => looped.delete(this);
				}
			},
			true,
			true,
		);

		WireComponent.staticSetPosition(this.instance, from, to);
	}

	setColors(colors: readonly Color3[]) {
		this.colors.set(colors);
	}
	subColors(colors: ReadonlyObservableValue<readonly Color3[]>) {
		this.event.subscribeObservable(colors, () => this.colors.set(colors.get()), true);
	}
	subColorsFromTypes(types: ReadonlyObservableValue<readonly (keyof BlockLogicTypes.Primitives)[]>) {
		this.event.subscribeObservable(types, () => this.colors.set(types.get().map(getTypeColor)), true);
	}

	static staticSetPosition(wire: WireComponentDefinition, from: Vector3, to: Vector3) {
		const distance = to.sub(from).Magnitude;

		wire.Size = new Vector3(distance - 0.4, 0.15, 0.15);
		wire.CFrame = new CFrame(from, to).mul(new CFrame(0, 0, -distance / 2)).mul(CFrame.Angles(0, math.rad(90), 0));
	}
}
