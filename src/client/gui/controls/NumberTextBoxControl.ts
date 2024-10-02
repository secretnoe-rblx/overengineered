import { Control } from "engine/client/gui/Control";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { MathUtils } from "engine/shared/fixes/MathUtils";
import { Strings } from "engine/shared/fixes/String.propmacro";

/** ObservableValue that stores a number that can be clamped */
class NumberObservableValue<T extends number | undefined = number> extends ObservableValue<T> {
	constructor(
		value: T,
		readonly min: number | undefined,
		readonly max: number | undefined,
		readonly step?: number,
	) {
		super(value);
	}

	protected processValue(value: T) {
		if (value === undefined) return value;
		return MathUtils.clamp(value, this.min, this.max, this.step) as T;
	}
}

type ToNum<TAllowNull extends boolean> = TAllowNull extends false ? number : number | undefined;
export type NumberTextBoxControlDefinition = TextBox;
/** Control that represents a number via a text input */
export class NumberTextBoxControl<TAllowNull extends boolean = false> extends Control<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(value: number) => void>();
	readonly value: ObservableValue<ToNum<TAllowNull>>;
	private textChanged = false;

	constructor(gui: NumberTextBoxControlDefinition);
	constructor(gui: NumberTextBoxControlDefinition, value: ObservableValue<number>);
	constructor(gui: NumberTextBoxControlDefinition, min: number | undefined, max: number | undefined, step?: number);
	constructor(
		gui: NumberTextBoxControlDefinition,
		min?: number | ObservableValue<number>,
		max?: number,
		step?: number,
	) {
		super(gui);

		if (min && typeIs(min, "table")) {
			this.value = min;
		} else {
			this.value = new NumberObservableValue<ToNum<TAllowNull>>(0, min, max, step);
		}

		this.event.subscribeObservable(
			this.value,
			(value) => {
				if (value === undefined) {
					this.gui.Text = "";
					return;
				}

				this.gui.Text = Strings.prettyNumber(value ?? 0, step);
			},
			true,
		);

		this.event.subscribe(this.gui.Focused, () => (this.textChanged = true));
		this.event.subscribe(this.gui.FocusLost, () => this.commit(true));
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, () => this.commit(false));
	}

	private commit(byLostFocus: boolean) {
		if (!this.textChanged) {
			return;
		}

		const text = this.gui.Text.gsub("[^-0123456789.]", "")[0];

		let num = tonumber(text);
		if (num === undefined) {
			if (byLostFocus) {
				this.gui.Text = tostring(this.value.get() ?? "");
				return;
			}

			this.gui.Text = "0";
			num = 0;
		}
		if (num === this.value.get()) return;

		this.value.set(num);
		this.submitted.Fire(this.value.get()!);
		this.gui.Text = tostring(this.value.get());
	}

	destroy() {
		this.commit(true);
		super.destroy();
	}
}
