import { UserInputService } from "@rbxts/services";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import type { BlockConfigPart, PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";

/*
 * BLOCK LOGIC with the DISTINCTION between OPERATIONS (add, mul, vec3 split) and ACTORS (screen, rocket)
 */

export type BlockTickState = {
	readonly tick: number;
	readonly ticked: Set<BlockLogic<BlockConfigBothDefinitions>>;
};

type LogicValue<T extends { readonly type: Keys; readonly value: defined }> = {
	pull(ctx: BlockTickState): T;
};

abstract class LogicValueBase<T extends { readonly type: Keys; readonly value: defined }> implements LogicValue<T> {
	private tick?: number;
	private tickCache?: T;
	pull(ctx: BlockTickState): T {
		if (this.tick !== ctx.tick) {
			this.tick = ctx.tick;
			this.tickCache = undefined;
		}

		return (this.tickCache ??= this.calculate(ctx));
	}
	protected abstract calculate(ctx: BlockTickState): T;
}

export class LogicValueFromBlock<TDef extends BlockConfigBothDefinitions> extends LogicValueBase<
	LogicResult<TDef, keyof TDef["output"]>
> {
	constructor(
		private readonly block: BlockLogicOperation<TDef>,
		private readonly key: keyof TDef["output"],
	) {
		super();
	}

	protected override calculate(ctx: BlockTickState): LogicResult<TDef, keyof TDef["output"]> {
		return this.block.autoCalculate(ctx)[this.key] as LogicResult<TDef, keyof TDef["output"]>;
	}
}

type TypedValue<TKey extends Keys> = { readonly type: TKey; readonly value: WithDefaultTypes[TKey]["default"] };

type Types = BlockConfigTypes2.Types;
type WithDefaultTypes = BlockConfigTypes2.Types;
type MiniTypes = { readonly [k in Keys]: Omit<Types[k], "config" | "default"> };
type Keys = keyof Types;

namespace Valuesz {
	abstract class LogicValueFromConfig<TKey extends Keys> implements LogicValue<TypedValue<TKey>> {
		constructor(
			protected readonly definition: Omit<WithDefaultTypes[TKey], "default" | "config">,
			protected readonly config: WithDefaultTypes[TKey]["config"],
		) {}

		private tick?: number;
		private tickCache?: TypedValue<TKey>;
		pull(ctx: BlockTickState): TypedValue<TKey> {
			if (this.tick !== ctx.tick) {
				this.tick = ctx.tick;
				this.tickCache = undefined;
			}

			return (this.tickCache ??= this.calculate(ctx));
		}
		protected abstract calculate(ctx: BlockTickState): TypedValue<TKey>;
	}

	export class _number extends LogicValueFromConfig<"number"> {
		protected override calculate(): TypedValue<"number"> {
			return { type: "number", value: this.config };
		}
	}
	export class bool extends LogicValueFromConfig<"bool"> {
		protected override calculate(): TypedValue<"bool"> {
			return { type: "bool", value: this.config };
		}
	}
	export class key extends LogicValueFromConfig<"key"> {
		protected override calculate(): TypedValue<"key"> {
			return { type: "key", value: this.config };
		}
	}
	export class clampedNumber extends LogicValueFromConfig<"clampedNumber"> {
		protected override calculate(): TypedValue<"clampedNumber"> {
			return { type: "clampedNumber", value: this.config };
		}
	}
}
const Values: {
	readonly [k in Keys]: new (
		definition: Omit<Types[k], "default" | "config">,
		config: Types[k]["config"],
	) => LogicValue<TypedValue<k>>;
} = {
	...Valuesz,
	number: Valuesz._number,
} as never;

type GenericValues = {
	readonly [k in Keys]: new (
		definition: Omit<Types[Keys], "default" | "config">,
		config: Types[Keys]["config"],
	) => LogicValue<TypedValue<k>>;
};
const GenericValues = Values as unknown as GenericValues;

//

type Filter<TKey extends Keys> = {
	readonly filter: (value: Types[TKey]["default"], definition: MiniTypes[TKey]) => Types[TKey]["default"];
};
const Filters: { readonly [k in Keys]: Filter<k> } = {
	number: {
		filter: (value: number) => value,
	},
	bool: {
		filter: (value: boolean) => value,
	},
	key: {
		filter: (value: Keys) => value,
	},
	clampedNumber: {
		filter: (value: number, definition: MiniTypes["clampedNumber"]) =>
			NumberObservableValue.clamp(value, definition.min, definition.max, definition.step),
	},
} as never;

type GenericFilters = { readonly [k in Keys]: Filter<Keys> };
const GenericFilters = Filters as GenericFilters;

//

type LogicDefToValues<
	TDef extends BlockConfigBothDefinitions,
	K extends keyof BlockConfigBothDefinitions,
	k extends keyof TDef[K],
> = WithDefaultTypes[keyof TDef[K][k]["types"] & Keys]["default"] & defined;
type LogicDefToKeys<
	TDef extends BlockConfigBothDefinitions,
	K extends keyof BlockConfigBothDefinitions,
	k extends keyof TDef[K],
> = keyof TDef[K][k]["types"] & Keys;

export type BlockLogicValues<TDef extends BlockConfigBothDefinitions, K extends keyof BlockConfigBothDefinitions> = {
	readonly [k in keyof TDef[K]]: LogicValue<TypedValue<LogicDefToKeys<TDef, K, k>>>;
};
export type BlockLogicOutputValues<
	TDef extends BlockConfigBothDefinitions,
	K extends keyof BlockConfigBothDefinitions,
> = {
	[k in keyof TDef[K]]: TypedValue<LogicDefToKeys<TDef, K, k>>;
};

type LogicResult<TDef extends BlockConfigBothDefinitions, TKey extends keyof TDef["output"]> = {
	readonly type: LogicDefToKeys<TDef, "output", TKey>;
	readonly value: LogicDefToValues<TDef, "output", TKey>;
};
export type BlockLogicResults<TDef extends BlockConfigBothDefinitions> = {
	readonly [k in keyof TDef["output"]]: LogicResult<TDef, k>;
};

type Configs<TDef extends BlockConfigBothDefinitions> = {
	readonly [k in keyof TDef["input"]]: BlockConfigPart<Keys & keyof TDef["input"][k]["types"]>;
};

abstract class BlockLogic<TDef extends BlockConfigBothDefinitions> extends Component {
	protected readonly inputs: Writable<BlockLogicValues<TDef, "input">>;

	// filtering? ////////////////////
	readonly output: Partial<BlockLogicOutputValues<TDef, "output">>;

	constructor(
		protected readonly definition: TDef,
		{ config, instance }: BlockLogicOperationArgs<TDef>,
	) {
		super();

		if (instance) {
			ComponentInstance.init(this, instance);
		}

		config = BlockConfig.addDefaults(config as PlacedBlockConfig | undefined, definition.input);

		this.inputs = asObject(
			asMap(definition.input).mapToMap((k, v) =>
				$tuple(k, new GenericValues[config[k].type](v.types[config[k].type]!, config[k].config)),
			),
		) as BlockLogicValues<TDef, "input">;
		this.output = asObject(
			asMap(definition.output).mapToMap((k, v) => $tuple(k, { type: config[k].type, value: config[k].config })),
		) as BlockLogicOutputValues<TDef, "output">;
	}
}
export { BlockLogic as BlockL };

type BlockLogicOperationArgs<TDef extends BlockConfigBothDefinitions> = {
	readonly config: Configs<TDef> | PlacedBlockConfig | undefined;
	readonly instance?: BlockModel;
};
type BlockLogicInstanceOperationArgs<TDef extends BlockConfigBothDefinitions> = ReplaceWith<
	BlockLogicOperationArgs<TDef>,
	{ readonly instance: BlockModel }
>;
export abstract class BlockLogicOperation<TDef extends BlockConfigBothDefinitions> extends BlockLogic<TDef> {
	constructor(definition: TDef, args: BlockLogicOperationArgs<TDef>) {
		super(definition, args);
	}

	replaceInput(
		key: keyof TDef["input"],
		value: LogicValue<TypedValue<LogicDefToKeys<TDef, "input", keyof TDef["input"]>>>,
	) {
		this.inputs[key] = value;
	}

	autoCalculate(ctx: BlockTickState): BlockLogicResults<TDef> {
		const def = this.definition;
		const filteredInputs = Objects.mapValues(
			this.inputs,
			(k, v): LogicValue<TypedValue<LogicDefToKeys<TDef, "input", keyof TDef["input"]>>> => ({
				pull(ctx: BlockTickState): TypedValue<LogicDefToKeys<TDef, "input", keyof TDef["input"]>> {
					const { type: vtype, value } = v.pull(ctx);
					return {
						type: vtype,
						value: GenericFilters[vtype].filter(
							value,
							(def.input as TDef["input"])[k].types[vtype]!,
						) as never,
					};
				},
			}),
		);

		const results = this.calculate(ctx, filteredInputs);
		const filteredResults = asObject(
			asMap(results).mapToMap(
				(k, v): LuaTuple<[keyof TDef["output"], LogicResult<TDef, keyof TDef["output"]>]> =>
					$tuple(k, {
						type: v.type,
						value: GenericFilters[v.type].filter(
							v.value,
							(this.definition.output as TDef["output"])[k].types[v.type]!,
						) as never,
					}),
			),
		);

		return filteredResults as BlockLogicResults<TDef>;
	}
	protected abstract calculate(ctx: BlockTickState, inputs: BlockLogicValues<TDef, "input">): BlockLogicResults<TDef>;
}
export abstract class BlockLogicInstanceOperation<
	TDef extends BlockConfigBothDefinitions,
	TBlock extends BlockModel,
> extends BlockLogicOperation<TDef> {
	protected readonly instance: TBlock;

	constructor(definition: TDef, args: BlockLogicInstanceOperationArgs<TDef>) {
		super(definition, args);
		this.instance = args.instance as TBlock;
	}
}

type InputKeysToArgs<T extends readonly (keyof TDef)[], TDef extends BlockConfigBothDefinitions["input"]> = {
	readonly [k in keyof T]: (WithDefaultTypes[keyof TDef[T[k]]["types"] & Keys] & defined)["default"];
};
type InputKeysToTypes<T extends readonly (keyof TDef)[], TDef extends BlockConfigBothDefinitions["input"]> = {
	readonly [k in keyof T]: keyof TDef[T[k]]["types"] & Keys;
};
export abstract class BlockLogicActor<
	TDef extends BlockConfigBothDefinitions,
	TBlock extends BlockModel = BlockModel,
> extends BlockLogic<TDef> {
	readonly instance: TBlock;

	private readonly _onTick = new ArgsSignal<[ctx: BlockTickState]>();
	protected readonly onTick = this._onTick.asReadonly();

	constructor(definition: TDef, args: BlockLogicInstanceOperationArgs<TDef>) {
		super(definition, args);
		this.instance = args.instance as TBlock;
	}

	protected on<const TInputs extends readonly (keyof TDef["input"])[]>(
		names: TInputs,
		callback: (
			values: InputKeysToArgs<TInputs, TDef["input"]>,
			types: InputKeysToTypes<TInputs, TDef["input"]>,
		) => void,
	) {
		this.onTick.Connect((ctx) => {
			const values = names.map((name) => this.inputs[name].pull(ctx));
			callback(values.map((v) => v.value) as never, values.map((v) => v.type) as never);
		});
	}

	/** @sealed */
	doTick(ctx: BlockTickState): void {
		if (ctx.ticked.has(this)) return;

		ctx.ticked.add(this);
		this._onTick.Fire(ctx);
		this.tick(ctx);
	}

	protected tick(ctx: BlockTickState): void {}
}

//

const adddef = {
	input: {
		value1: {
			displayName: "Value 1",
			group: "0",
			types: {
				clampedNumber: {
					config: 0 as number,
					min: 0,
					max: 1,
					step: 1,
				},
			},
		},
		value2: {
			displayName: "Value 2",
			group: "0",
			types: {
				clampedNumber: {
					config: 0 as number,
					min: 0,
					max: 1,
					step: 1,
				},
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			group: "0",
			types: {
				number: {
					config: 0 as number,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;
class Add extends BlockLogicOperation<typeof adddef> {
	constructor(args: BlockLogicOperationArgs<typeof adddef>) {
		super(adddef, args);
	}

	protected override calculate(
		ctx: BlockTickState,
		{ value1, value2 }: BlockLogicValues<typeof adddef, "input">,
	): BlockLogicResults<typeof adddef> {
		return {
			result: {
				type: "number",
				value: value1.pull(ctx).value + value2.pull(ctx).value,
			},
		};
	}
}

const eqdef = {
	input: {
		value1: BlockConfigDefinitions.any("Value 1", "0"),
		value2: BlockConfigDefinitions.any("Value 2", "0"),
	},
	output: {
		result: {
			displayName: "Result",
			types: {
				bool: {
					config: false as boolean,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;
class Eq extends BlockLogicOperation<typeof eqdef> {
	constructor(args: BlockLogicOperationArgs<typeof eqdef>) {
		super(eqdef, args);
	}

	protected override calculate(
		ctx: BlockTickState,
		{ value1, value2 }: BlockLogicValues<typeof eqdef, "input">,
	): BlockLogicResults<typeof eqdef> {
		return {
			result: {
				type: "bool",
				value: value1.pull(ctx).value === value2.pull(ctx).value,
			},
		};
	}
}

const keydef = {
	input: {
		key: {
			displayName: "Key",
			types: {
				key: { config: "F" },
			},
		},
		reversed: {
			displayName: "Reversed",
			types: {
				bool: { config: false },
			},
		},
		switch: {
			displayName: "Switch",
			types: {
				bool: { config: false },
			},
		},
	},
	output: {
		result: {
			displayName: "Input",
			types: {
				bool: { config: false },
			},
		},
	},
} satisfies BlockConfigBothDefinitions;
class KeySensor extends BlockLogicOperation<typeof keydef> {
	constructor(args: BlockLogicOperationArgs<typeof keydef>) {
		super(keydef, args);
	}

	protected override calculate(
		ctx: BlockTickState,
		{ key, reversed, switch: _switch }: BlockLogicValues<typeof keydef, "input">,
	): BlockLogicResults<typeof keydef> {
		const keyv = key.pull(ctx).value as KeyCode;

		return {
			result: {
				type: "bool",
				value: UserInputService.IsKeyDown(keyv),
			},
		};
	}
}

export namespace BlockLogic3Tests {
	export function test() {
		const addcfg: Configs<typeof adddef> = {
			value1: { type: "clampedNumber", config: 1 },
			value2: { type: "clampedNumber", config: 2 },
		};
		const blocks: readonly BlockLogicOperation<BlockConfigBothDefinitions>[] = [
			new Add({ config: addcfg }),
			new Add({ config: addcfg }),
			new Eq({ config: { value1: { type: "number", config: 1 }, value2: { type: "number", config: 2 } } }),
			new KeySensor({
				config: {
					key: { type: "key", config: "F" },
					reversed: { type: "bool", config: false },
					switch: { type: "bool", config: false },
				},
			}),
		] as never;

		const printc = (index: number) =>
			print(
				"calc" + index,
				blocks.map((b) => b.autoCalculate({ tick: index, ticked: new Set() }).result.value).join(),
			);

		let tick = 1;
		printc(tick++);

		blocks[1].replaceInput("value1", new LogicValueFromBlock(blocks[0], "result") as never);
		blocks[1].replaceInput("value2", new LogicValueFromBlock(blocks[0], "result") as never);

		blocks[2].replaceInput("value1", new LogicValueFromBlock(blocks[0], "result") as never);
		blocks[2].replaceInput("value2", new LogicValueFromBlock(blocks[1], "result") as never);

		printc(tick++);

		blocks[2].replaceInput("value1", new LogicValueFromBlock(blocks[1], "result") as never);
		blocks[2].replaceInput("value2", new LogicValueFromBlock(blocks[1], "result") as never);

		printc(tick++);

		task.spawn(() => {
			while (true as boolean) {
				task.wait();

				if (UserInputService.IsKeyDown("F")) {
					printc(tick++);
				}
			}
		});

		//blocks[0].replaceInput("value1", new Values._number({}, 1));
		//blocks[0].replaceInput("value2", new Values._number({}, 2));
		// printc(3);
	}
}
