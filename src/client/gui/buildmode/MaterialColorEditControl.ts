import { Players } from "@rbxts/services";
import { ColorChooser } from "client/gui/ColorChooser";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { TextButtonControl } from "engine/client/gui/Button";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Marketplace } from "engine/shared/Marketplace";
import { Colors } from "shared/Colors";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { MaterialChooserDefinition } from "client/gui/MaterialChooser";
import type { ButtonControl, TextButtonDefinition } from "engine/client/gui/Button";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export type MaterialColorEditControlDefinition = GuiObject & {
	readonly Color: GuiObject & {
		readonly Content: ColorChooserDefinition;
		readonly Header: TextButtonDefinition & {
			readonly Pipette: GuiButton & {
				readonly ImageLabel: ImageLabel;
			};
			readonly Arrow: GuiObject;
		};
	};
	readonly Material: GuiObject & {
		readonly Content: MaterialChooserDefinition;
		readonly Header: TextButtonDefinition & {
			readonly Pipette: ImageButton & {
				readonly ImageLabel: ImageLabel;
			};
			readonly Arrow: GuiObject;
		};
	};
};

/** Material preview with an edit button */
export class MaterialColorEditControl extends InstanceComponent<MaterialColorEditControlDefinition> {
	readonly materialPipette;
	readonly colorPipette;

	readonly materialv;
	readonly colorv;

	private readonly heightOverlays;

	constructor(gui: MaterialColorEditControlDefinition, defaultVisibility = false) {
		super(gui);

		const materialv = SubmittableValue.from<Enum.Material>(Enum.Material.Plastic);
		this.materialv = materialv.asHalfReadonly();

		const colorv = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
		this.colorv = colorv.asHalfReadonly();

		const material = this.parent(new MaterialChooser(gui.Material.Content, materialv));
		const color = this.parent(new ColorChooser(gui.Color.Content, colorv));

		const materialbtn = this.parent(new TextButtonControl(this.instance.Material.Header));
		this.event.subscribeObservable(
			material.value.value,
			(value) => {
				const imgl = this.instance.Material.Content.FindFirstChild(value.Name) as ImageLabel & {
					readonly TextLabel: TextLabel;
				};
				this.instance.Material.Header.Pipette.Image = imgl.Image;
				materialbtn.text.set(imgl.TextLabel.Text);
			},
			true,
		);

		const colorbtn = this.parent(new TextButtonControl(this.instance.Color.Header));
		this.event.subscribeObservable(
			color.value.value,
			(value) => colorbtn.text.set("#" + value.ToHex().upper()),
			true,
		);
		this.event.subscribeObservable(
			color.value.value,
			(value) => {
				this.instance.Color.Header.Pipette.BackgroundColor3 = value;

				const imgColor = value.ToHSV()[2] > 0.5 ? Colors.black : Colors.white;
				if (this.instance.Color.Header.Pipette.ImageLabel.ImageColor3 !== imgColor) {
					TransformService.cancel(this.instance.Color.Header.Pipette.ImageLabel);
					TransformService.run(this.instance.Color.Header.Pipette.ImageLabel, (tr) =>
						tr.transform(
							this.instance.Color.Header.Pipette.ImageLabel,
							"ImageColor3",
							imgColor,
							Transforms.quadOut02,
						),
					);
				}
			},
			true,
		);

		type HeightOverlayState = "opened" | "closed" | "hidden";
		this.heightOverlays = asObject(
			(["Color", "Material"] as const).mapToMap((k) =>
				$tuple(k, {
					overlay: new ObjectOverlayStorage({ state: "opened" as HeightOverlayState }),
					heights: {
						opened: gui[k].Size.Y,
						closed: gui[k].Header.Size.Y,
						hidden: new UDim(),
					} as const satisfies { [k in HeightOverlayState]: UDim },
				}),
			),
		);
		const initVisibilityAnimation = (button: ButtonControl, name: keyof typeof this.heightOverlays) => {
			const setOverlayVisibility = (visible: boolean) =>
				(this.heightOverlays[name].overlay.get(0).state = visible ? undefined : "closed");

			const gui = this.instance[name];
			let isvisible = false;
			this.event.subscribe(button.activated, () => setOverlayVisibility((isvisible = !isvisible)));

			const defaultArrowSize = gui.Header.Arrow.Size;
			this.heightOverlays[name].overlay.value.subscribe(({ state }) => {
				const tr = Transforms.create();

				if (state !== "hidden") {
					tr.transform(gui.Header.Arrow, "Rotation", state === "closed" ? 180 : 0, Transforms.quadOut02);
					tr.transform(gui.Header.Arrow, "Size", defaultArrowSize, Transforms.quadOut02);
				} else {
					tr.transform(gui.Header.Arrow, "Rotation", 360, Transforms.quadOut02);
					tr.transform(gui.Header.Arrow, "Size", new UDim2(), Transforms.quadOut02);
				}

				if (state !== "hidden") {
					tr.show(this.instance).then();
				}

				tr.transform(
					gui,
					"Size",
					new UDim2(gui.Size.X, this.heightOverlays[name].heights[state]),
					Transforms.quadOut02,
				);

				if (state === "hidden") {
					tr.then().hide(this.instance);
				}

				tr.run(this);
			});

			this.heightOverlays[name].overlay.get(-1).state = "hidden";
			setOverlayVisibility((isvisible = defaultVisibility));
			TransformService.finish(this);
		};
		initVisibilityAnimation(materialbtn, "Material");
		initVisibilityAnimation(colorbtn, "Color");

		this.materialPipette = this.parent(
			BlockPipetteButton.forMaterial(this.instance.Material.Header.Pipette, (m) => {
				if (
					m === Enum.Material.Neon &&
					!Marketplace.Gamepass.has(Players.LocalPlayer, GameDefinitions.GAMEPASSES.NeonMaterial)
				) {
					m = Enum.Material.Plastic;
				}

				materialv.submit(m);
			}),
		);
		this.colorPipette = this.parent(
			BlockPipetteButton.forColor(this.instance.Color.Header.Pipette, (c) => colorv.submit(c)),
		);

		this.onEnabledStateChange((enabled) => {
			for (const [, overlay] of pairs(this.heightOverlays)) {
				overlay.overlay.get(-1).state = enabled ? undefined : "hidden";
			}
		});
	}

	autoSubscribe(material: ObservableValue<Enum.Material>, color: ObservableValue<Color3>) {
		this.event.subscribeObservable(material, (m) => this.materialv.set(m), true, true);
		this.event.subscribe(this.materialv.submitted, (v) => material.set(v));

		this.event.subscribeObservable(color, (m) => this.colorv.set(m), true, true);
		this.event.subscribe(this.colorv.submitted, (v) => color.set(v));
	}
}
