import { Control } from "engine/client/gui/Control";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";

export type PlayerSettingBaseDefinition = GuiObject & {
	readonly TitleLabel: TextLabel;
};
export class PlayerSettingBase<T extends PlayerSettingBaseDefinition, V> extends Control<T> {
	protected readonly _submitted = new ArgsSignal<[value: V]>();
	readonly submitted: ReadonlyArgsSignal<[value: V]> = this._submitted;
	readonly value: ObservableValue<V>;

	constructor(gui: T, name: string, defaultValue: V) {
		super(gui);

		gui.TitleLabel.Text = name;
		this.value = new ObservableValue<V>(defaultValue);
	}
}
