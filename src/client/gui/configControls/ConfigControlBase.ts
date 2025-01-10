import { PartialControl } from "engine/client/gui/PartialControl";
import { Observables } from "engine/shared/event/Observables";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import type { SignalReadonlySubmittableValue } from "engine/shared/event/SubmittableValue";

// Returns full paths of the object T, but only for values assignable to V
type FilteredPath<T, V> = T extends object
	? { [K in keyof T]: T[K] extends V ? [K] : T[K] extends object ? [K, ...FilteredPath<T[K], V>] : never }[keyof T]
	: [];

export type ConfigControlBaseDefinition = GuiObject & ConfigControlBaseDefinitionParts;
export type ConfigControlBaseDefinitionParts = {
	readonly TitleLabel: TextLabel;
	readonly DescriptionLabel?: TextLabel;
};
export class ConfigControlBase<
	T extends ConfigControlBaseDefinitionParts,
	V,
	TParts extends ConfigControlBaseDefinitionParts = T,
> extends PartialControl<TParts> {
	protected readonly _value: ObservableValue<V>;
	protected readonly _v;
	readonly v;

	constructor(gui: GuiObject & T, name: string, defaultValue: V) {
		super(gui);

		this.parts.TitleLabel.Text = name;
		this._value = new ObservableValue<V>(defaultValue);
		this._v = new SubmittableValue(this._value);
		this.v = this._v.asFullReadonly();

		this.setDescription(undefined);
	}

	setDescription(text: string | undefined): this {
		if (this.parts.DescriptionLabel) {
			this.parts.DescriptionLabel.Text = text ?? "";
			this.parts.DescriptionLabel.Visible = text !== undefined;
		}

		return this;
	}

	/** Set the value and initialize the subscription */
	initToObjectPart(
		value: ObservableValue<PlayerConfig>,
		path: FilteredPath<PlayerConfig, V>,
		subtype?: "submit" | "value",
	): this;
	initToObjectPart<V2>(
		value: ObservableValue<PlayerConfig>,
		path: FilteredPath<PlayerConfig, V2>,
		subtype: "submit" | "value" | undefined,
		resultFunc: (selv: this) => SignalReadonlySubmittableValue<V2>,
	): this;
	initToObjectPart<V2>(
		value: ObservableValue<PlayerConfig>,
		path: readonly string[],
		subtype: "submit" | "value" = "submit",
		resultFunc?: (selv: this) => SignalReadonlySubmittableValue<V2>,
	): this {
		const result = (resultFunc?.(this) as undefined | SignalReadonlySubmittableValue<V>) ?? this._v;

		const ov = this.event.addObservable(
			Observables.createObservableFromObjectPropertySV(value, result, path, subtype),
		);
		result.set(ov.get());

		return this.initToObservable(ov, subtype, () => result);
	}

	initToObservable<V2>(
		observable: ObservableValue<V2>,
		subtype: "submit" | "value" = "submit",
		resultFunc?: (selv: this) => SignalReadonlySubmittableValue<V2>,
	): this {
		const result = resultFunc?.(this) ?? (this._v as unknown as SignalReadonlySubmittableValue<V2>);

		if (subtype === "submit") {
			result.submitted.Connect((v) => observable.set(v));
		} else if (subtype === "value") {
			result.value.subscribe((v) => observable.set(v));
		} else subtype satisfies never;

		return this;
	}
}
