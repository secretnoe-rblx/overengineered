import { UserInputService } from "@rbxts/services";
import { Anim } from "client/gui/Anim";
import { Color4Chooser } from "client/gui/Color4Chooser";
import { ColorVisualizerWithAlpha } from "client/gui/ColorVisualizerWithAlpha";
import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { Color4TextBox } from "client/gui/controls/Color4TextBox";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { Observables } from "engine/shared/event/Observables";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import type { Color4ChooserDefinition as Color4ChooserDefinition } from "client/gui/Color4Chooser";
import type { ColorVisualizerWithAlphaDefinition } from "client/gui/ColorVisualizerWithAlpha";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { PopupController } from "client/gui/PopupController";

class ColorControl extends Control<ConfigControlColorDefinition["Control"]> {
	readonly value;

	constructor(gui: ConfigControlColorDefinition["Control"], defaultColor: Color4, allowAlpha: boolean) {
		super(gui);

		const v = new SubmittableValue(new ObservableValue<Color4>(defaultColor));
		this.value = v.asHalfReadonly();

		this.parent(new Color4TextBox(gui.RGBA, v, allowAlpha));
		this.parent(new ColorVisualizerWithAlpha(gui.Preview, v.value));

		this.$onInjectAuto((popupController: PopupController) => {
			const scale = (Anim.findScreen(gui)?.FindFirstChild("UIScale") as UIScale | undefined)?.Scale ?? 1;

			this.parent(new Control(gui.EditControl)) //
				.addButtonAction(() => {
					const mousePos = UserInputService.GetMouseLocation().div(scale);

					const template = Interface.getInterface<{
						Floating: {
							Color: GuiObject & { Content: GuiObject & { Control: Color4ChooserDefinition } };
						};
					}>().Floating.Color;
					const colorGui = template.Clone();
					colorGui.Position = new UDim2(0, mousePos.X, 0, mousePos.Y);

					const window = new Control(colorGui);
					const color = window.parent(new Color4Chooser(colorGui.Content.Control, v, allowAlpha));

					const popup = popupController.showPopup(window);

					let isInside = false;
					colorGui.MouseEnter.Connect(() => (isInside = true));
					colorGui.MouseLeave.Connect(() => (isInside = false));
					popup.event.subInput((ih) => {
						task.delay(0, () => {
							ih.onTouchTap(() => {
								const mouse = Interface.mouse;
								const objects = Interface.getPlayerGui().GetGuiObjectsAtPosition(mouse.X, mouse.Y);
								if (objects.contains(colorGui)) return;

								popup.destroy();
							});
						});

						ih.onMouse1Down(() => {
							if (isInside) return;
							popup.destroy();
						}, true);
					});
				});
		});

		this.parent(new Control(gui.UnsetControl)) //
			.addButtonAction(() => v.submit(defaultColor));
	}
}

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Color: ConfigControlColorDefinition;
	}
}

export type ConfigControlColorDefinition = ConfigControlBaseDefinition & {
	readonly Control: GuiObject & {
		readonly Preview: ColorVisualizerWithAlphaDefinition;
		readonly RGBA: TextBox;
		readonly EditControl: GuiButton;
		readonly UnsetControl: GuiButton;
	};
};
export class ConfigControlColor extends ConfigControlBase<ConfigControlColorDefinition, Color4> {
	constructor(gui: ConfigControlColorDefinition, name: string, defaultColor: Color4, alpha = false) {
		super(gui, name);

		const control = this.parent(new ColorControl(gui.Control, defaultColor, alpha));

		this.initFromMultiWithDefault(control.value.value, () => defaultColor);
		this.event.subscribe(control.value.submitted, (value) => this.submit(this.multiMap(() => value)));
	}

	initColor(
		observable: ObservableValue<object>,
		colorPath: readonly string[],
		transparencyPath: readonly string[],
		updateType: "value" | "submit" = "submit",
	): this {
		const color = this.event.addObservable(
			Observables.createObservableFromObjectProperty<Color3>(observable, colorPath),
		);
		let alpha = this.event.addObservable(
			Observables.createObservableFromObjectProperty<number>(observable, transparencyPath),
		);
		alpha = this.event.addObservable(
			alpha.fCreateBased(
				(c) => 1 - c,
				(c) => 1 - c,
			),
		);

		const stuff = this.event.addObservable(Observables.createObservableFromMultiple({ color, alpha }));

		return this.initToObservable(stuff, updateType);
	}
}

export class ConfigControlColor3 extends ConfigControlBase<ConfigControlColorDefinition, Color3> {
	constructor(gui: ConfigControlColorDefinition, name: string, defaultColor: Color3) {
		super(gui, name);

		const control = this.parent(new ColorControl(gui.Control, { alpha: 1, color: defaultColor }, false));

		const c3 = this.event.addObservable(
			control.value.value.fCreateBased(
				(c) => c.color,
				(c) => ({ alpha: 1, color: c }),
			),
		);
		this.initFromMultiWithDefault(c3, () => defaultColor);
		this.event.subscribe(control.value.submitted, (value) => this.submit(this.multiMap(() => value.color)));
	}
}
