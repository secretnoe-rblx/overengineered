import { ContextActionService } from "@rbxts/services";
import { InputController } from "engine/client/InputController";
import { SelectButtonPopup } from "client/gui/popup/SelectButtonPopup";
import { Control } from "engine/client/gui/Control";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";

export type KeyOrStringChooserControlDefinition = TextButton;

type ToStr<TAllowNull extends boolean> = TAllowNull extends false ? string : string | undefined;
/** Control that represents a key */
export class KeyOrStringChooserControl<
	TAllowNull extends boolean = false,
> extends Control<KeyOrStringChooserControlDefinition> {
	readonly submitted = new Signal<(value: string, prev: ToStr<TAllowNull>) => void>();
	readonly value = new ObservableValue<ToStr<TAllowNull>>("P");

	constructor(gui: KeyOrStringChooserControlDefinition) {
		super(gui);

		const buttonColor = this.gui.BackgroundColor3;
		const buttonColorActive = Colors.lightenPressed(this.gui.BackgroundColor3);

		this.value.subscribe((value) => (this.gui.Text = value ?? ""));

		this.gui.Activated.Connect(() => {
			if (InputController.inputType.get() === "Touch") {
				SelectButtonPopup.showPopup(
					true,
					(key) => {
						const prev = this.value.get();
						this.value.set(key);
						this.submitted.Fire(key, prev);
					},
					() => {},
				);
			} else {
				this.gui.BackgroundColor3 = buttonColorActive;

				const actionName = "peKeySelection";
				ContextActionService.BindActionAtPriority(
					actionName,
					(name, state, input) => {
						if (actionName === name) {
							if (input.KeyCode === Enum.KeyCode.Escape || input.KeyCode === Enum.KeyCode.Unknown) {
								return Enum.ContextActionResult.Sink;
							}

							ContextActionService.UnbindAction(actionName);

							const prev = this.value.get();
							this.value.set(input.KeyCode.Name);
							this.submitted.Fire(input.KeyCode.Name, prev);
							this.gui.BackgroundColor3 = buttonColor;
						}
					},
					false,
					2000 + 1,
					Enum.UserInputType.Keyboard,
					Enum.UserInputType.Gamepad1,
				);

				this.onDisable(() => ContextActionService.UnbindAction(actionName));
			}
		});
	}
}
