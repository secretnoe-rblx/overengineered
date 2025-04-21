import { ContextActionService, UserInputService } from "@rbxts/services";
import { Anim } from "client/gui/Anim";
import { ConfigControlBase } from "client/gui/configControls/ConfigControlBase";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { Materials } from "engine/shared/data/Materials";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import type { ConfigControlBaseDefinition } from "client/gui/configControls/ConfigControlBase";
import type { MaterialChooserDefinition } from "client/gui/MaterialChooser";
import type { PopupController } from "client/gui/PopupController";

class MaterialControl extends Control<ConfigControlMaterialDefinition["Control"]> {
	readonly value;

	constructor(gui: ConfigControlMaterialDefinition["Control"], defaultMaterial: Enum.Material) {
		super(gui);

		const v = new SubmittableValue(new ObservableValue<Enum.Material>(defaultMaterial));
		this.value = v.asHalfReadonly();

		const preview = (gui.Preview, v.value);
		v.value.subscribe((m) => (gui.Preview.ImageLabel.Image = Materials.getMaterialTextureAssetId(m)), true);

		this.$onInjectAuto((popupController: PopupController) => {
			const scale = (Anim.findScreen(gui)?.FindFirstChild("UIScale") as UIScale | undefined)?.Scale ?? 1;

			this.parent(new Control(gui.EditControl)) //
				.addButtonAction(() => {
					const mousePos = UserInputService.GetMouseLocation().div(scale);

					const template = Interface.getInterface<{
						Floating: {
							Material: GuiObject & { Content: MaterialChooserDefinition };
						};
					}>().Floating.Material;
					const colorGui = template.Clone();
					colorGui.Position = new UDim2(0, mousePos.X, 0, mousePos.Y);

					const window = new Control(colorGui);
					const color = window.parent(new MaterialChooser(colorGui.Content, v));

					const popup = popupController.showPopup(window);

					let isInside = false;
					colorGui.MouseEnter.Connect(() => (isInside = true));
					colorGui.MouseLeave.Connect(() => (isInside = false));

					ContextActionService.BindAction(
						"everything",
						() => Enum.ContextActionResult.Sink,
						false,
						Enum.UserInputType.Keyboard,
						Enum.UserInputType.Gamepad1,
					);
					popup.onDestroy(() => ContextActionService.UnbindAction("everything"));

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
			.addButtonAction(() => v.submit(defaultMaterial));
	}
}

declare module "client/gui/configControls/ConfigControlsList" {
	export interface ConfigControlTemplateList {
		readonly Material: ConfigControlMaterialDefinition;
	}
}

export type ConfigControlMaterialDefinition = ConfigControlBaseDefinition & {
	readonly Control: GuiObject & {
		readonly Preview: GuiObject & {
			readonly ImageLabel: ImageLabel;
		};
		readonly EditControl: GuiButton;
		readonly UnsetControl: GuiButton;
	};
};
export class ConfigControlMaterial extends ConfigControlBase<ConfigControlMaterialDefinition, Enum.Material> {
	constructor(gui: ConfigControlMaterialDefinition, name: string, defaultMaterial: Enum.Material) {
		super(gui, name);

		const control = this.parent(new MaterialControl(gui.Control, defaultMaterial));

		this.initFromMultiWithDefault(control.value.value, () => defaultMaterial);
		this.event.subscribe(control.value.submitted, (value) => this.submit(this.multiMap(() => value)));
	}
}
