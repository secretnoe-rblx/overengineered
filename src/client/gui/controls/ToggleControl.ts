import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";
import type { TransformProps } from "engine/shared/component/Transform";

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

		const animate = (enabled: boolean, props: TransformProps | undefined) => {
			Transforms.create()
				.move(this.instance.Circle, new UDim2(enabled ? 0.5 : 0, 0, 0, 0), props)
				.transform(this.instance, "BackgroundColor3", enabled ? this.activeColor : this.color, props)
				.run(this.value, true);
		};
		this.event.subscribeObservable(this.value, (enabled) => animate(enabled, Transforms.quadOut02));
		this.onEnable(() => animate(this.value.get(), undefined));
	}
}
