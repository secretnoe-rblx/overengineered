import { ContextActionService } from "@rbxts/services";
import { SelectButtonPopup, SelectButtonPopupWithCustomString } from "client/gui/popup/SelectButtonPopup";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";
import type { PopupController } from "client/gui/PopupController";

export type KeyChooserControlDefinition = TextButton;

type ToStr<NonString extends boolean> = NonString extends false ? KeyCode : KeyCode | string;
/** Control that represents a key */
class _KeyChooserControl<TKC extends boolean> extends Control<KeyChooserControlDefinition> {
	readonly submitted = new Signal<(value: ToStr<TKC>, prev: ToStr<TKC>) => void>();
	readonly value = new ObservableValue<ToStr<TKC>>("P");

	constructor(
		gui: KeyChooserControlDefinition,
		touchChooserCtor: TKC extends true ? typeof SelectButtonPopupWithCustomString : typeof SelectButtonPopup,
	) {
		super(gui);

		const buttonColor = this.gui.BackgroundColor3;
		const buttonColorActive = Colors.lightenPressed(this.gui.BackgroundColor3);

		this.value.subscribe((value) => (this.gui.Text = value === "Unknown" ? "" : value));

		this.$onInjectAuto((popupController: PopupController) => {
			this.gui.Activated.Connect(() => {
				if (InputController.inputType.get() === "Touch") {
					const p = new touchChooserCtor(
						(key) => {
							const prev = this.value.get();
							this.value.set(key as ToStr<TKC>);
							this.submitted.Fire(key as ToStr<TKC>, prev);
						},
						() => {},
					);

					popupController.showPopup(p);
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
		});
	}
}

export class KeyChooserControl extends _KeyChooserControl<false> {
	constructor(gui: KeyChooserControlDefinition) {
		super(gui, SelectButtonPopup);
	}
}
export class KeyOrStringChooserControl extends _KeyChooserControl<true> {
	constructor(gui: KeyChooserControlDefinition) {
		super(gui, SelectButtonPopupWithCustomString);
	}
}
