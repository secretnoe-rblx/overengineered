import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ArgsSignal } from "shared/event/Signal";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";

type ValueType = BlockConfigTypes2.TypeKeys;

class LogicValue<T extends defined> extends Component {
	private readonly _changed = new ArgsSignal<
		[value: T, valueType: ValueType, prevValue: T | undefined, prevValueType: ValueType | undefined]
	>();
	readonly changed = this._changed.asReadonly();

	private valueType: ValueType | undefined;
	private value: T | undefined;

	constructor() {
		super();
	}

	set(valueType: ValueType, value: T) {
		const prevValue = this.value;
		const prevValueType = this.valueType;

		this.value = value;
		this.valueType = valueType;

		this._changed.Fire(value, valueType, prevValue, prevValueType);
	}

	protected hasValue(): this is LogicValue<T> & { valueType: ValueType; value: T } {
		if (!this.valueType) return false;
		if (!this.value) return false;

		return true;
	}
}
class InputLogicValue<T extends defined> extends LogicValue<T> {
	readonly ___nominal = "InputLogicValue";

	//
}
class OutputLogicValue<T extends defined> extends LogicValue<T> {
	readonly ___nominal = "OutputLogicValue";

	readonly connections = new Set<InputLogicValue<defined>>();

	set(valueType: ValueType, value: T) {
		super.set(valueType, value);

		// const toDelete: InputLogicValue<defined>[] = [];
		// for (const logic of this.connections) {
		// 	if (!logic.isEnabled()) {
		// 		continue;
		// 	}

		// 	if (logic.isDestroyed()) {
		// 		toDelete.push(logic);
		// 		continue;
		// 	}

		// 	logic.set(valueType, value); // ????? wrong
		// }

		// for (const logic of toDelete) {
		// 	this.connections.delete(logic);
		// }
	}

	connectTo(inputLogicValue: InputLogicValue<defined>) {
		this.connections.add(inputLogicValue);
	}
}

type InputKeysToArgs<T extends readonly (keyof TDef)[], TDef extends BlockConfigBothDefinitions["input"]> = {
	readonly [k in keyof T]: (TDef[T[k]]["types"][keyof TDef[T[k]]["types"] & BlockConfigTypes2.TypeKeys] &
		defined)["default"];
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

export class BlockLogic2<
	TDef extends BlockConfigBothDefinitions,
	TInstance extends BlockModel = BlockModel,
> extends Component {
	readonly input: LogicValues<TDef, "input">;
	readonly output: LogicValues<TDef, "output">;

	readonly inputSubscriptions = new Map<readonly (keyof TDef["input"])[], (...args: any[]) => void>();

	constructor(instance: TInstance, definition: TDef) {
		super();

		ComponentInstance.init(this, instance);

		const input = {
			//
		};
		this.input = {} as never;
		this.output = {} as never;
	}

	protected onInput<const TInputs extends readonly (keyof TDef["input"])[]>(
		inputs: TInputs,
		callback: (...args: InputKeysToArgs<TInputs, TDef["input"]>) => void,
	) {
		this.inputSubscriptions.set(inputs, callback);
	}

	tick() {}
}

/** Groups multiple logic values  */
class LogicValuesGroup {
	//
}

type adddef = {
	input: {
		value1: {
			displayName: "Value 1";
			defaultType: "number";
			types: {
				number: {
					config: number;
					default: number;
				};
			};
		};
		value2: {
			displayName: "Value 2";
			defaultType: "number";
			types: {
				number: {
					config: number;
					default: number;
				};
			};
		};
	};
	output: {
		result: {
			displayName: "Result";
			defaultType: "number";
			types: {
				number: {
					config: number;
					default: number;
				};
			};
		};
	};
};
class Add extends BlockLogic2<adddef> {
	constructor() {
		super(undefined!, undefined!);

		this.onInput(["value1", "value2"], (value1, value2) => {
			this.output.result.set("number", value1 + value2);
		});
	}
}

namespace BlockTicker {
	export function start(blocks: readonly BlockLogic2<BlockConfigBothDefinitions>[]): never {
		type change = {
			readonly logicValue: OutputLogicValue<defined>;
			readonly value: defined;
			readonly valueType: ValueType;
			readonly prevValue: defined | undefined;
			readonly prevValueType: ValueType | undefined;
		};
		const changed: change[] = [];

		for (const block of blocks) {
			for (const [k, v] of pairs(block.output)) {
				v.changed.Connect((value, valueType, prevValue, prevValueType) => {
					changed.push({ logicValue: v, value, valueType, prevValue, prevValueType });
				});
			}
		}

		while (true as boolean) {
			for (const change of changed) {
				for (const connection of change.logicValue.connections) {
					if (!connection.isEnabled()) continue;

					if (connection.isDestroyed()) {
						// TODO: remove or something
						continue;
					}

					connection.set(change.valueType, change.value);
				}
			}
			changed.clear();

			for (const block of blocks) {
				for (const [names, callback] of block.inputSubscriptions) {
					const inputs = names.map((name) => block.input[name]);
					//
				}

				block.tick();
			}

			//

			task.wait();
		}

		// unreachable
		return undefined as never;
	}
}
