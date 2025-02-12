import { ContextActionService } from "@rbxts/services";
import { SelectButtonPopup } from "client/gui/popup/SelectButtonPopup";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";

export type KeyChooserControlDefinition = TextButton;

/** Control that represents a key. */
export class KeyChooserControl extends Control<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(value: KeyCode, prev: KeyCode) => void>();
	readonly value = new ObservableValue<KeyCode>("P");

	private readonly color = Colors.accentDark;
	private readonly activeColor = Colors.accent;

	constructor(gui: KeyChooserControlDefinition) {
		super(gui);

		this.value.subscribe((value) => (this.gui.Text = value === "Unknown" ? "" : value));
		this.event.onPrepare(() => (this.gui.BackgroundColor3 = this.color));

		this.gui.Activated.Connect(() => {
			if (InputController.inputType.get() === "Touch") {
				SelectButtonPopup.showPopup(
					false,
					(key) => {
						const prev = this.value.get();
						this.value.set(key);
						this.submitted.Fire(key, prev);
					},
					() => {},
				);
			} else {
				this.gui.BackgroundColor3 = this.activeColor;

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
							this.gui.BackgroundColor3 = this.color;
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
