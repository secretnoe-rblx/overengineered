import { UserInputService } from "@rbxts/services";
import { Color4Chooser } from "client/gui/Color4Chooser";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { Component } from "engine/shared/component/Component";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Materials } from "engine/shared/data/Materials";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Colors } from "shared/Colors";
import type { Color4ChooserDefinition } from "client/gui/Color4Chooser";
import type { MaterialChooserDefinition } from "client/gui/MaterialChooser";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

export type MaterialColorEditControlDefinition = GuiObject & {
	readonly Color: TextButtonDefinition & {
		readonly Pipette: GuiButton & {
			readonly ImageLabel: ImageLabel;
		};
		readonly Arrow: GuiObject;
	};
	readonly Material: TextButtonDefinition & {
		readonly Pipette: ImageButton & {
			readonly ImageLabel: ImageLabel;
		};
		readonly Arrow: GuiObject;
	};
};

class ResizableWindow<T extends GuiObject & { readonly TextLabel: TextLabel }> extends Control<T> {
	constructor(gui: T, minSize: number, maxSize: number) {
		super(gui);

		class Dragger extends Component {
			readonly dragStarted;
			readonly dragged;
			readonly dragEnded;

			constructor(instance: GuiObject) {
				super();

				const dragStarted = new ArgsSignal();
				this.dragStarted = dragStarted.asReadonly();
				const dragEnded = new ArgsSignal();
				this.dragEnded = dragEnded.asReadonly();

				const dragged = new ArgsSignal<[delta: Vector2]>();
				this.dragged = dragged.asReadonly();

				let isInside = false;
				this.onDisable(() => (isInside = false));
				this.event.subscribe(instance.MouseEnter, () => (isInside = true));
				this.event.subscribe(instance.MouseLeave, () => (isInside = false));

				let isMoving = false;
				this.onDisable(() => (isMoving = false));
				this.event.subInput((ih) => {
					let start: Vector2 | undefined;

					ih.onMouse1Down(() => {
						if (!isInside) return;
						dragStarted.Fire();
						isMoving = true;
						start = UserInputService.GetMouseLocation();
					}, true);
					ih.onMouse1Up(() => {
						if (!isMoving) return;

						isMoving = false;
						dragEnded.Fire();
					}, true);

					ih.onMouseMove((input) => {
						if (!isMoving) return;

						start ??= UserInputService.GetMouseLocation();
						const delta = start.sub(UserInputService.GetMouseLocation());
						dragged.Fire(delta);
					}, true);
				});
			}
		}
		const dragger = this.parent(new Dragger(gui.TextLabel));

		let startPos = 0;
		dragger.dragStarted.Connect(() => (startPos = gui.Size.Y.Offset));
		dragger.dragged.Connect(({ Y: y }) => {
			y = math.clamp(startPos + y, minSize, maxSize);
			gui.Size = new UDim2(gui.Size.X, new UDim(gui.Size.Y.Scale, y));
		});
	}
}

export type ColorWindowDefinition = GuiObject & {
	readonly TextLabel: TextLabel;
	readonly Content: GuiObject & {
		readonly Control: Color4ChooserDefinition;
	};
};
class ColorWindow extends Control<ColorWindowDefinition> {
	constructor(gui: ColorWindowDefinition, value: SubmittableValue<Color3>) {
		super(gui);

		const v = new SubmittableValue<Color4>(new ObservableValue({ alpha: 1, color: value.get() }));
		this.event.subscribeObservable(v.value, (val) => value.set(val.color));
		this.event.subscribeObservable(value.value, (val) => v.set({ alpha: 1, color: val }));
		v.submitted.Connect((v) => value.submit(v.color));

		this.parent(new Color4Chooser(gui.Content.Control, v, false));
	}
}

export type MaterialWindowDefinition = GuiObject & {
	readonly TextLabel: TextLabel;
	readonly Content: MaterialChooserDefinition;
};
class MaterialWindow extends ResizableWindow<MaterialWindowDefinition> {
	constructor(
		gui: MaterialWindowDefinition,
		value: SubmittableValue<Enum.Material>,
		color: ReadonlyObservableValue<Color3>,
	) {
		super(gui, 100, 592);
		this.parent(new MaterialChooser(gui.Content, value, color));
	}
}

/** Material preview with an edit button */
export class MaterialColorEditControl extends InstanceComponent<MaterialColorEditControlDefinition> {
	static autoCreate(showOnEnable: boolean = false) {
		const template = Interface.getInterface<{
			Tools: { Shared: { Bottom: { Dropups: MaterialColorEditControlDefinition } } };
		}>().Tools.Shared.Bottom.Dropups;
		const dropups = template.Clone();
		dropups.Visible = true;

		return new MaterialColorEditControl(dropups, showOnEnable);
	}

	readonly materialPipette;
	readonly colorPipette;

	readonly materialv;
	readonly colorv;

	constructor(gui: MaterialColorEditControlDefinition, showOnEnable: boolean = false) {
		super(gui);

		const floatingTemplate = Interface.getInterface<{
			readonly Floating: {
				readonly Color: ColorWindowDefinition;
				readonly Material: MaterialWindowDefinition;
			};
		}>().Floating;

		const materialv = SubmittableValue.from<Enum.Material>(Enum.Material.Plastic);
		this.materialv = materialv.asHalfReadonly();

		const colorv = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
		this.colorv = colorv.asHalfReadonly();

		const materialbtn = this.parent(new TextButtonControl(this.instance.Material));
		this.event.subscribeObservable(
			materialv.value,
			(value) => {
				this.instance.Material.Pipette.Image = Materials.getMaterialTextureAssetId(value);
				MaterialChooser.setColorOfPreview(colorv.get(), this.instance.Material.Pipette);
				materialbtn.text.set(Materials.getMaterialDisplayName(value).upper());
			},
			true,
		);

		const colorbtn = this.parent(new TextButtonControl(this.instance.Color));
		this.event.subscribeObservable(colorv.value, (value) => colorbtn.text.set("#" + value.ToHex().upper()), true);
		this.event.subscribeObservable(
			colorv.value,
			(value) => {
				this.instance.Color.Pipette.BackgroundColor3 = value;
				MaterialChooser.setColorOfPreview(value, this.instance.Material.Pipette);

				const imgColor = value.ToHSV()[2] > 0.5 ? Colors.black : Colors.white;
				if (this.instance.Color.Pipette.ImageLabel.ImageColor3 !== imgColor) {
					TransformService.cancel(this.instance.Color.Pipette.ImageLabel);
					TransformService.run(this.instance.Color.Pipette.ImageLabel, (tr) =>
						tr.transform(
							this.instance.Color.Pipette.ImageLabel,
							"ImageColor3",
							imgColor,
							Transforms.quadOut02,
						),
					);
				}
			},
			true,
		);

		{
			const gui = floatingTemplate.Color.Clone();
			gui.Parent = colorbtn.instance;
			gui.AnchorPoint = new Vector2(0, 1);
			gui.Position = new UDim2(0, 0, 0, -4);

			const wnd = this.parentDestroyOnly(new ColorWindow(gui, colorv));
			this.onDisable(() => wnd.setVisibleAndEnabled(false));
			if (showOnEnable) {
				this.onEnable(() => wnd.setVisibleAndEnabled(true));
			}
			colorbtn.addButtonAction(() => wnd.setVisibleAndEnabled(!wnd.isInstanceVisible()));
		}
		{
			const gui = floatingTemplate.Material.Clone();
			gui.Parent = materialbtn.instance;
			gui.AnchorPoint = new Vector2(0, 1);
			gui.Position = new UDim2(0, 0, 0, -4);

			const wnd = this.parentDestroyOnly(new MaterialWindow(gui, materialv, colorv.value));
			this.onDisable(() => wnd.setVisibleAndEnabled(false));
			if (showOnEnable) {
				this.onEnable(() => wnd.setVisibleAndEnabled(true));
			}
			materialbtn.addButtonAction(() => wnd.setVisibleAndEnabled(!wnd.isInstanceVisible()));
		}

		this.materialPipette = this.parent(
			BlockPipetteButton.forMaterial(this.instance.Material.Pipette, (m) => {
				materialv.submit(m);
			}),
		);
		this.colorPipette = this.parent(
			BlockPipetteButton.forColor(this.instance.Color.Pipette, (c) => colorv.submit(c)),
		);
	}

	autoSubscribe(material: ObservableValue<Enum.Material>, color: ObservableValue<Color3>) {
		this.event.subscribeObservable(material, (m) => this.materialv.set(m), true, true);
		this.event.subscribe(this.materialv.submitted, (v) => material.set(v));

		this.event.subscribeObservable(color, (m) => this.colorv.set(m), true, true);
		this.event.subscribe(this.colorv.submitted, (v) => color.set(v));
	}
}
