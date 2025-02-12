import { ButtonAnimatedClickComponent } from "engine/client/gui/ButtonAnimatedClickComponent";
import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";
import type { Theme } from "client/Theme";
import type { TextButtonDefinition } from "engine/client/gui/Button";

export type SwitchControlDefinition = GuiObject & {
	readonly Template: TextButtonDefinition;
};

export interface SwitchControlItem {
	readonly name?: string;
	readonly description?: string;
}

type TAllowNull<T extends string, Allow extends boolean> = Allow extends true ? T | undefined : T;
class _SwitchControl<T extends string, AllowNull extends boolean> extends Control<SwitchControlDefinition> {
	private readonly _submitted = new Signal<(value: T) => void>();
	readonly submitted = this._submitted.asReadonly();
	readonly value;

	constructor(gui: SwitchControlDefinition, options: readonly [key: T, item: SwitchControlItem][]) {
		super(gui);
		this.value = new ObservableValue<TAllowNull<T, AllowNull>>(options[0][0]);

		const template = this.asTemplate(gui.Template, true);

		const set = (key: T) => {
			this.value.set(key);
			this._submitted.Fire(key);
		};

		const colorSelected = new ObservableValue(Colors.accent);
		const colorDeselected = new ObservableValue(Colors.accentDark);

		this.onInject((di) => {
			const theme = di.resolve<Theme>();
			this.event.subscribeObservable(theme.get("buttonActive"), (c) => colorSelected.set(c), true);
			this.event.subscribeObservable(theme.get("buttonNormal"), (c) => colorDeselected.set(c), true);
		});

		for (const [key, option] of options) {
			const button = this.parent(new Control(template())) //
				.setButtonText(option.name ?? key)
				.addButtonAction(() => set(key));
			button.getComponent(ButtonAnimatedClickComponent);

			button
				.valuesComponent() //
				.get("BackgroundColor3")
				.addTransitionBetweenBoolObservables(
					this.event,
					this.value.createBased((k) => k === key),
					colorSelected,
					colorDeselected,
					Transforms.quadOut02,
				);
		}
	}
}

/** Control that represents a chosable value. */
export class SwitchControl<T extends string = string> extends _SwitchControl<T, false> {}

/** Control that represents a chosable value, nullable. */
export class SwitchControlNullable<T extends string = string> extends _SwitchControl<T, true> {}
