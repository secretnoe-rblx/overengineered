import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";
import type { Theme } from "client/Theme";

export type ToggleControlDefinition = TextButton & {
	readonly Circle: TextButton;
};

/** Control that represents a boolean */
export class ToggleControl extends Control<ToggleControlDefinition> {
	private readonly _submitted = new Signal<(value: boolean) => void>();
	readonly submitted = this._submitted.asReadonly();
	readonly value = new ObservableValue(false);

	constructor(gui: ToggleControlDefinition) {
		super(gui);

		const clicked = () => {
			this.value.set(!this.value.get());
			this._submitted.Fire(this.value.get());
		};

		gui.Circle.AutoButtonColor = false;
		this.event.subscribe(gui.MouseButton1Click, clicked);
		this.event.subscribe(gui.Circle.MouseButton1Click, clicked);

		const colorTrue = new ObservableValue(Colors.accent);
		const colorFalse = new ObservableValue(Colors.accentDark);

		this.onInject((di) => {
			const theme = di.resolve<Theme>();
			this.event.subscribeObservable(theme.get("buttonActive"), (c) => colorTrue.set(c), true);
			this.event.subscribeObservable(theme.get("buttonNegative"), (c) => colorFalse.set(c), true);
		});

		const circle = this.parent(new Control(gui.Circle));

		this.valuesComponent() //
			.get("BackgroundColor3")
			.addTransitionBetweenBoolObservables(this.event, this.value, colorTrue, colorFalse, Transforms.quadOut02);

		circle
			.valuesComponent()
			.get("Position")
			.addChildOverlay(this.value.createBased((enabled) => new UDim2(enabled ? 0.5 : 0, 0, 0, 0)))
			.addBasicTransform(Transforms.quadOut02);
	}
}
