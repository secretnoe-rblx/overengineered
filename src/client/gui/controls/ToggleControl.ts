import { GuiAnimator } from "client/gui/GuiAnimator";
import { Control } from "engine/client/gui/Control";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";

export type ToggleControlDefinition = TextButton & {
	readonly Circle: TextButton;
};

/** Control that represents a boolean */
export class ToggleControl extends Control<ToggleControlDefinition> {
	private readonly _submitted = new Signal<(value: boolean) => void>();
	readonly submitted = this._submitted.asReadonly();
	readonly value = new ObservableValue(false);

	private readonly color = Colors.accentDark;
	private readonly activeColor = Colors.accent;

	constructor(gui: ToggleControlDefinition) {
		super(gui);

		const clicked = () => {
			this.value.set(!this.value.get());
			this._submitted.Fire(this.value.get());
		};

		gui.Circle.AutoButtonColor = false;
		this.event.subscribe(gui.MouseButton1Click, clicked);
		this.event.subscribe(gui.Circle.MouseButton1Click, clicked);

		GuiAnimator.value(
			this.event,
			this.gui.Circle,
			this.value,
			(value) => {
				return {
					Position: new UDim2(value ? 0.5 : 0, 0, 0, 0),
				};
			},
			new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);
		GuiAnimator.value(
			this.event,
			this.gui,
			this.value,
			(value) => {
				return {
					BackgroundColor3: value ? this.activeColor : this.color,
				};
			},
			new TweenInfo(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		);
	}
}
