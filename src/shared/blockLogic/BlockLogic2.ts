import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ArgsSignal } from "shared/event/Signal";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";

/**
 * BLOCK subscribes to its INPUT values, maybe through the combining LogicValuesGroup
 * then, IMMEDIATELY writes whatever it wants to its OUTPUT
 *
 * the block's OUTPUT is being monitored from the outside (by BlockTicker or whatever the name that i'll change it to)
 * THEN, in the NEXT ITERATION, those OUTPUTS (only the changed ones) are being written into the subscribed blocks' INPUTS
 *
 * EVERY ITERATION goes over every block that has its OUTPUT values CHANGED
 * WHICH starts with the UNCONNECTED block value groups only because they set the values on the block creation
 *
 * after EVERY ITERATION every CHANGED block value is stored, and being rerun in the next iteraion
 *     unless it has already been changed this tick
 * ITERATIONS stop when there's no changed block values
 */

type ValueType = BlockConfigTypes2.TypeKeys;

class LogicValue<T extends defined, TType extends ValueType = ValueType> extends Component {
	private valueType: TType | undefined;
	private value: T | undefined;

	protected setValue(valueType: TType, value: T) {
		const prevValue = this.value;
		const prevValueType = this.valueType;

		this.value = value;
		this.valueType = valueType;

		return $tuple(prevValue, prevValueType);
	}

	get() {
		if (!this.valueType) return undefined;
		if (!this.value) return undefined;

		return $tuple(this.value, this.valueType);
	}
}
class InputLogicValue<T extends defined, TType extends ValueType = ValueType> extends LogicValue<T, TType> {
	readonly ___nominal = "InputLogicValue";

	private readonly _changed = new ArgsSignal<
		[value: T, valueType: TType, prevValue: T | undefined, prevValueType: TType | undefined, context: SetContext]
	>();
	readonly changed = this._changed.asReadonly();

	set(valueType: TType, value: T, context: SetContext): void {
		const [prevValue, prevValueType] = this.setValue(valueType, value);
		this._changed.Fire(value, valueType, prevValue, prevValueType, context);
	}
}
class OutputLogicValue<T extends defined, TType extends ValueType = ValueType> extends LogicValue<T, TType> {
	readonly ___nominal = "OutputLogicValue";

	private readonly _changed = new ArgsSignal<
		[value: T, valueType: TType, prevValue: T | undefined, prevValueType: TType | undefined]
	>();
	readonly changed = this._changed.asReadonly();

	readonly connections = new Set<InputLogicValue<defined>>();

	set(valueType: TType, value: T) {
		const [prevValue, prevValueType] = this.setValue(valueType, value);
		this._changed.Fire(value, valueType, prevValue, prevValueType);
	}

	connectTo(inputLogicValue: InputLogicValue<defined>) {
		this.connections.add(inputLogicValue);
	}
}

type InputKeysToArgs<T extends readonly (keyof TDef)[], TDef extends BlockConfigBothDefinitions["input"]> = {
	readonly [k in keyof T]: (TDef[T[k]]["types"][keyof TDef[T[k]]["types"] & BlockConfigTypes2.TypeKeys] &
		defined)["default"];
};
type InputKeysToTypes<T extends readonly (keyof TDef)[], TDef extends BlockConfigBothDefinitions["input"]> = {
	readonly [k in keyof T]: keyof TDef[T[k]]["types"] & BlockConfigTypes2.TypeKeys;
};

type InputValuesToArgs<T extends readonly InputLogicValue<defined>[]> = {
	readonly [k in keyof T]: T[k] extends InputLogicValue<infer R> ? R : never;
};
type InputValuesToTypes<T extends readonly InputLogicValue<defined>[]> = {
	readonly [k in keyof T]: T[k] extends InputLogicValue<defined, infer R> ? R : never;
};

type LogicDefToValues<
	TDef extends BlockConfigBothDefinitions,
	K extends keyof BlockConfigBothDefinitions,
	k extends keyof TDef[K],
> = (TDef[K][k]["types"][keyof TDef[K][k]["types"] & BlockConfigTypes2.TypeKeys] & defined)["default"];
type LogicValues<TDef extends BlockConfigBothDefinitions, K extends keyof BlockConfigBothDefinitions> = {
	readonly [k in keyof TDef[K]]: K extends "input"
		? InputLogicValue<LogicDefToValues<TDef, K, k>>
		: OutputLogicValue<LogicDefToValues<TDef, K, k>>;
};

export class BlockLogicInputSource {
	//
}
export class NumberBlockLogicInputSource extends BlockLogicInputSource {
	readonly output = new OutputLogicValue<number, "number">();
}

export class BlockLogic2<
	TDef extends BlockConfigBothDefinitions,
	TInstance extends BlockModel = BlockModel,
> extends Component {
	readonly input: LogicValues<TDef, "input">;
	readonly output: LogicValues<TDef, "output">;

	private readonly _groupedValues: LogicValuesGroup<InputLogicValue<defined>[]>[] = [];
	readonly groupedValues = this._groupedValues.asReadonly();

	constructor(instance: TInstance, definition: TDef) {
		super();

		ComponentInstance.init(this, instance);

		this.input = asObject(
			asMap(definition.input).mapToMap((k, v) =>
				$tuple(k as keyof TDef["input"], this.parent(new InputLogicValue())),
			),
		) as never;
		this.output = asObject(
			asMap(definition.output).mapToMap((k, v) =>
				$tuple(k as keyof TDef["output"], this.parent(new OutputLogicValue())),
			),
		) as never;
	}

	protected onInput<const TInputs extends readonly (keyof TDef["input"])[]>(
		names: TInputs,
		callback: (
			values: InputKeysToArgs<TInputs, TDef["input"]>,
			types: InputKeysToTypes<TInputs, TDef["input"]>,
		) => void,
	) {
		const group = this.parent(new LogicValuesGroup(...names.map((name) => this.input[name])));

		// god i hope the callback type is not wrong
		this.event.subscribe(group.changed, callback as never);

		this._groupedValues.push(group);
	}

	tick() {}
}

/** Groups multiple logic values to run the .changed callback only once all the values are set */
class LogicValuesGroup<const TInputs extends readonly InputLogicValue<defined>[]> extends Component {
	private readonly _changed = new ArgsSignal<
		[
			values: InputValuesToArgs<TInputs>,
			valueTypes: InputValuesToTypes<TInputs>,
			// prevValues: InputValuesToArgs<TInputs>,
			// prevValueTypes: InputValuesToTypes<TInputs>,
		]
	>();
	readonly changed = this._changed.asReadonly();

	private readonly unsetInputs = new Set<InputLogicValue<defined>>();
	private readonly inputs: TInputs;

	private wasChanged: boolean = false;

	constructor(...inputs: TInputs) {
		super();

		this.inputs = inputs;
		this.unsetInputs = new Set(inputs);
		print("creating with", this.unsetInputs.size());

		for (const input of inputs) {
			this.event.subscribe(input.changed, (value, valueType, prevValue, prevValueType, context) => {
				this.unsetInputs.delete(input);

				$trace("changing to", value, ";area???,", this.areAllValuesSet(), this.unsetInputs.size());
				if (this.areAllValuesSet()) {
					this.wasChanged = true;
					context.groupsAffected.add(this);
				}
			});
		}
	}

	flushChanges() {
		if (!this.wasChanged) return;

		$trace("FLUSHING to", ";area???,", this.areAllValuesSet(), this.unsetInputs.size());
		this.wasChanged = false;
		this._changed.Fire(this.inputs.map((i) => i.get()![0]) as never, this.inputs.map((i) => i.get()![1]) as never);
	}

	private areAllValuesSet(): boolean {
		return this.unsetInputs.size() === 0;
	}
}

const adddef = {
	input: {
		value1: {
			displayName: "Value 1",
			defaultType: "number",
			group: "0",
			types: {
				number: {
					config: 0 as number,
					default: 0 as number,
				},
			},
		},
		value2: {
			displayName: "Value 2",
			defaultType: "number",
			group: "0",
			types: {
				number: {
					config: 0 as number,
					default: 0 as number,
				},
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			defaultType: "number",
			group: "0",
			types: {
				number: {
					config: 0 as number,
					default: 0 as number,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;
export class Add extends BlockLogic2<typeof adddef> {
	constructor() {
		super(new Instance("Model") as BlockModel, adddef);

		this.onInput(["value1", "value2"], ([value1, value2], [type1, type2]) => {
			$trace("changed of ", value1, value2, type1, type2);
			this.output.result.set("number", value1 + value2);
		});
	}
}

type change = {
	readonly logicValue: OutputLogicValue<defined>;
	readonly value: defined;
	readonly valueType: ValueType;
	readonly prevValue: defined | undefined;
	readonly prevValueType: ValueType | undefined;
};
type SetContext = {
	readonly groupsAffected: Set<LogicValuesGroup<readonly InputLogicValue<defined>[]>>;
};
export class BlockTicker {
	private readonly changed: change[] = [];
	private readonly context: SetContext = { groupsAffected: new Set() };

	constructor(private readonly outputValues: readonly OutputLogicValue<defined>[]) {
		for (const [k, v] of pairs(outputValues)) {
			v.changed.Connect((value, valueType, prevValue, prevValueType) => {
				print("change", prevValue, "->", value);
				this.changed.push({ logicValue: v, value, valueType, prevValue, prevValueType });
			});

			const [value, valueType] = v.get()!;
			if (value && valueType) {
				this.changed.push({ logicValue: v, value, valueType, prevValue: undefined, prevValueType: undefined });
			}
		}
	}

	tick() {
		while (true as boolean) {
			while (true as boolean) {
				print("ticking ourselves", this.changed);
				const changedCopy = [...this.changed];
				this.changed.clear();

				for (const change of changedCopy) {
					for (const connection of change.logicValue.connections) {
						if (!connection.isEnabled()) continue;

						if (connection.isDestroyed()) {
							// TODO: remove or something
							continue;
						}

						connection.set(change.valueType, change.value, this.context);
					}
				}

				if (this.changed.size() === 0) break;
			}

			if (this.context.groupsAffected.size() === 0) break;

			for (const group of this.context.groupsAffected) {
				group.flushChanges();
			}
			this.context.groupsAffected.clear();
		}
	}
}
