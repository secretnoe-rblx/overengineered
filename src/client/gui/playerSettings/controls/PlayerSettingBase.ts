import { Control } from "engine/client/gui/Control";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";

type Path<T> = T extends object ? { [K in keyof T]: [K, ...Path<T[K]>] }[keyof T] : [];
const getValueByPath = (obj: unknown, path: Path<PlayerConfig>) => {
	let v = obj;
	for (const p of path) {
		v = (v as { [k in string]: unknown })[p];
	}

	return v;
};

const createObjectWithValueByPath = <V, TPath extends Path<PlayerConfig>>(value: V, path: TPath) => {
	const obj: { [k in string]: unknown } = {};
	let part = obj;
	for (const [i, p] of ipairs(path)) {
		if (i === path.size()) {
			part[p] = value;
		} else {
			part = part[p] = {};
		}
	}

	return obj;
};

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
	/** Set the value and initialize the subscription */
	init<TPath extends Path<PlayerConfig>>(
		config: Partial<PlayerConfig>,
		submitFunc: (obj: { [k in string]?: unknown }) => void,
		path: TPath,
		subtype: "submit" | "value" = "submit",
	): this {
		this.value.set(getValueByPath(config, path) as V);

		if (subtype === "submit") {
			this.submitted.Connect((v) => submitFunc(createObjectWithValueByPath(v, path)));
		} else if (subtype === "value") {
			this.value.subscribe((v) => submitFunc(createObjectWithValueByPath(v, path)));
		} else subtype satisfies never;

		return this;
	}
}
