import { Control } from "engine/client/gui/Control";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Objects } from "engine/shared/fixes/Objects";
import type { SignalReadonlySubmittableValue } from "engine/shared/event/SubmittableValue";

// Returns full paths of the object T, but only for values assignable to V
type FilteredPath<T, V> = T extends object
	? { [K in keyof T]: T[K] extends V ? [K] : T[K] extends object ? [K, ...FilteredPath<T[K], V>] : never }[keyof T]
	: [];

const getValueByPath = (obj: unknown, path: readonly string[]) => {
	let v = obj;
	for (const p of path) {
		v = (v as { [k in string]: unknown })[p];
	}

	return v;
};
const createObjectWithValueByPath = <V>(value: V, path: readonly string[]) => {
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
	readonly DescriptionLabel?: TextLabel;
};
export class PlayerSettingBase<T extends PlayerSettingBaseDefinition, V> extends Control<T> {
	protected readonly value: ObservableValue<V>;
	protected readonly v;

	constructor(gui: T, name: string, defaultValue: V) {
		super(gui);

		gui.TitleLabel.Text = name;
		this.value = new ObservableValue<V>(defaultValue);
		this.v = new SubmittableValue(this.value);

		this.setDescription(undefined);
	}

	setDescription(text: string | undefined): this {
		if (InstanceComponent.exists(this.instance, "DescriptionLabel")) {
			this.instance.DescriptionLabel.Text = text ?? "";
			this.instance.DescriptionLabel.Visible = text !== undefined;
		}

		return this;
	}

	/** Set the value and initialize the subscription */
	init(value: ObservableValue<PlayerConfig>, path: FilteredPath<PlayerConfig, V>, subtype?: "submit" | "value"): this;
	init<V>(
		value: ObservableValue<PlayerConfig>,
		path: FilteredPath<PlayerConfig, V>,
		subtype: "submit" | "value" | undefined,
		resultFunc: (selv: this) => SignalReadonlySubmittableValue<V>,
	): this;
	init<V>(
		value: ObservableValue<PlayerConfig>,
		path: readonly string[],
		subtype: "submit" | "value" = "submit",
		resultFunc?: (selv: this) => SignalReadonlySubmittableValue<V>,
	): this {
		const result = resultFunc?.(this) ?? (this.v as unknown as SignalReadonlySubmittableValue<V>);
		result.set(getValueByPath(value.get(), path) as V);
		const update = (v: V): void => {
			const config = Objects.deepCombine(value.get(), createObjectWithValueByPath(v, path));
			value.set(config);
		};

		if (subtype === "submit") {
			result.submitted.Connect(update);
		} else if (subtype === "value") {
			result.value.subscribe(update);
		} else subtype satisfies never;

		return this;
	}
}
