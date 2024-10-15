import { UserInputService } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { ClientInstanceComponent } from "engine/client/component/ClientInstanceComponent";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { OldTransformService } from "engine/shared/component/OldTransformService";
import { Element } from "engine/shared/Element";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

const tooltipsGui = Interface.getGameUI<{ Help: { Controls: TooltipsControlDefinition } }>().Help.Controls;
tooltipsGui.Visible = true;

const keyboardTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.KeyboardTemplate);
const gamepadTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.GamepadTemplate);

export type Tooltip = { readonly keys: readonly KeyCode[]; readonly text: string };
export type Tooltips = readonly Tooltip[];
export interface InputTooltips {
	readonly Desktop?: Tooltips;
	readonly Gamepad?: Tooltips;
}

type TooltipsControlDefinition = GuiObject & {
	GamepadTemplate: GuiObject & {
		ImageLabel: ImageLabel;
		TextLabel: TextLabel;
	};
	KeyboardTemplate: GuiObject & {
		TextLabel: TextLabel;
		Keys: GuiObject & {
			ImageLabel: ImageLabel & {
				KeyLabel: TextLabel;
			};
		};
	};
};

export class TooltipsHolder extends ClientInstanceComponent<
	GuiObject,
	InstanceComponent<typeof tooltipsGui.KeyboardTemplate>
> {
	static createComponent(category: string): TooltipsHolder {
		const gui = Element.create(
			"Frame",
			{
				Size: new UDim2(1, 0, 0, 0),
				AutomaticSize: Enum.AutomaticSize.Y,
				BackgroundTransparency: 1,
				Name: category,
				Parent: tooltipsGui,
			},
			{
				list: Element.create("UIListLayout", {
					FillDirection: Enum.FillDirection.Vertical,
					SortOrder: Enum.SortOrder.LayoutOrder,
					VerticalAlignment: Enum.VerticalAlignment.Bottom,
				}),
			},
		);

		return new TooltipsHolder(gui);
	}

	private readonly instances: GuiObject[] = [];
	private tooltips: InputTooltips = {};
	constructor(instance: GuiObject) {
		super(instance);
		this.onPrepare(() => this.set(this.tooltips));
		this.onDisable(() => this.justSet({}));
	}

	private createTooltip(tooltip: Tooltip) {
		const button = keyboardTooltipTemplate();
		button.TextLabel.Text = tooltip.text;

		for (let i = 0; i < tooltip.keys.size(); i++) {
			let key;

			if (i === 0) key = button.Keys.ImageLabel;
			else {
				key = button.Keys.ImageLabel.Clone();
				key.Parent = button.Keys;
			}

			const sub = (key: KeyCode): string => {
				if (key === "Zero") return "0";
				if (key === "One") return "1";
				if (key === "Two") return "2";
				if (key === "Three") return "3";
				if (key === "Four") return "4";
				if (key === "Five") return "5";
				if (key === "Six") return "6";
				if (key === "Seven") return "7";
				if (key === "Eight") return "8";
				if (key === "Nine") return "9";

				if (key === "KeypadZero") return "Num0";
				if (key === "KeypadOne") return "Num1";
				if (key === "KeypadTwo") return "Num2";
				if (key === "KeypadThree") return "Num3";
				if (key === "KeypadFour") return "Num4";
				if (key === "KeypadFive") return "Num5";
				if (key === "KeypadSix") return "Num6";
				if (key === "KeypadSeven") return "Num7";
				if (key === "KeypadEight") return "Num8";
				if (key === "KeypadNine") return "Num9";

				if (key === "LeftControl") return "Ctrl";
				if (key === "LeftShift") return "Shift";
				if (key === "RightControl") return "RCtrl";
				if (key === "RightShift") return "RShift";

				return key;
			};

			if (tooltip.keys[i].sub(0, "Button".size()) === "Button") {
				// gamepad button
				key.KeyLabel.Text = "";
				key.Image = UserInputService.GetImageForKeyCode(tooltip.keys[i]);
			} else if (tooltip.keys[i].sub(0, "DPad".size()) === "DPad") {
				// gamepad dpad
				key.KeyLabel.Text = "";
				key.Image = UserInputService.GetImageForKeyCode(tooltip.keys[i]);
			} else {
				key.KeyLabel.Text = sub(tooltip.keys[i]);
			}
		}

		if (this.isEnabled()) {
			OldTransformService.run(button, (tr) =>
				tr
					.transform("Size", new UDim2(1, 0, 0, 0))
					.then()
					.transform("Size", new UDim2(1, 0, 0, 50), OldTransformService.commonProps.quadOut02),
			);
		} else {
			button.Visible = false;
		}

		return button;
	}

	private destroyTooltip(tooltip: GuiObject) {
		OldTransformService.run(tooltip, (tr) => {
			tr.transform("Size", new UDim2(1, 0, 0, 0), OldTransformService.commonProps.quadOut02)
				.then()
				.func(() => tooltip.Destroy());
		});
	}

	set(tooltips: InputTooltips) {
		this.tooltips = tooltips;
		this.justSet(tooltips);
	}
	private justSet(tooltips: InputTooltips) {
		for (const tooltip of this.instances) {
			this.destroyTooltip(tooltip);
		}
		this.instances.clear();

		const set = (tooltips: Tooltips) => {
			for (const tooltip of tooltips) {
				const instance = this.createTooltip(tooltip);
				instance.Parent = this.instance;
				this.instances.push(instance);
			}
		};

		if (InputController.inputType.get() === "Desktop" && tooltips.Desktop) {
			set(tooltips.Desktop);
		} else if (InputController.inputType.get() === "Gamepad" && tooltips.Gamepad) {
			set(tooltips.Gamepad);
		}
	}

	destroy(): void {
		task.delay(0.2, () => super.destroy());
	}
}
