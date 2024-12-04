import { UserInputService } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Element } from "engine/shared/Element";
import { Keys } from "engine/shared/fixes/Keys";
import type { KeybindRegistration, KeyCombination } from "client/Keybinds";

const tooltipsGui = Interface.getGameUI<{ Help: { Controls: TooltipsControlDefinition } }>().Help.Controls;
tooltipsGui.Visible = true;

const keyboardTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.KeyboardTemplate);
const gamepadTooltipTemplate = Control.asTemplateWithMemoryLeak(tooltipsGui.GamepadTemplate);

export type Tooltip = { readonly keys: readonly KeyCombination[]; readonly text: string };
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

export class TooltipsHolder extends InstanceComponent<GuiObject> {
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
		this.event.onPrepare(() => this.set(this.tooltips));
		this.onDisable(() => this.justSet({}));
	}

	private createTooltip(tooltip: Tooltip) {
		const button = keyboardTooltipTemplate();
		button.TextLabel.Text = tooltip.text;

		button.Keys.ImageLabel.Visible = false;

		for (const combination of tooltip.keys) {
			for (const k of combination) {
				if (Keys.isKeyGamepad(k)) {
					if (InputController.inputType.get() !== "Gamepad") continue;

					const key = button.Keys.ImageLabel.Clone();
					key.Visible = true;
					key.Parent = button.Keys;
					key.KeyLabel.Text = "";
					key.Image = UserInputService.GetImageForKeyCode(k);
				} else {
					if (InputController.inputType.get() !== "Desktop") continue;

					const key = button.Keys.ImageLabel.Clone();
					key.Visible = true;
					key.Parent = button.Keys;
					key.KeyLabel.Text = Keys.toReadable(k);
				}
			}
		}

		if (!this.isEnabled()) {
			button.Visible = false;
		}

		return button;
	}

	setFromKeybinds(...keybinds: readonly KeybindRegistration[]) {
		this.set({
			Desktop: keybinds.map(
				(kb): Tooltip => ({
					text: kb.displayPath[kb.displayPath.size() - 1],
					keys: kb.getKeys(),
				}),
			),
		});
	}

	set(tooltips: InputTooltips) {
		this.tooltips = tooltips;
		this.justSet(tooltips);
	}
	private justSet(tooltips: InputTooltips) {
		for (const tooltip of this.instances) {
			tooltip.Destroy();
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
