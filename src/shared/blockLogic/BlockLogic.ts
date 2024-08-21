import {
	BlockBackedInputLogicValueStorage,
	LogicValueStorageContainer,
	LogicValueStorages,
	UnsetBlockLogicValueStorage,
} from "shared/blockLogic/BlockLogicValueStorage";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ArgsSignal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes3 } from "shared/blockLogic/BlockLogicTypes";
import type {
	ReadonlyLogicValueStorage,
	WriteonlyLogicValueStorage,
	ILogicValueStorage,
} from "shared/blockLogic/BlockLogicValueStorage";

type Primitives = BlockLogicTypes3.Primitives;
type NonPrimitives = BlockLogicTypes3.NonPrimitives;
type AllTypes = BlockLogicTypes3.Types;
type MiniPrimitives = { readonly [k in PrimitiveKeys]: Omit<Primitives[k], "config" | "default"> };
type MiniNonPrimitives = { readonly [k in NonPrimitiveKeys]: Omit<NonPrimitives[k], "config" | "default"> };
type MiniAllTypes = { readonly [k in AllKeys]: Omit<AllTypes[k], "config" | "default"> };
type PrimitiveKeys = keyof Primitives;
type NonPrimitiveKeys = keyof NonPrimitives;
type AllKeys = keyof AllTypes;

export type BlockLogicWithConfigDefinitionTypes<TKeys extends PrimitiveKeys> = {
	readonly [k in TKeys]: OmitOverUnion<
		Extract<AllTypes[AllKeys], { readonly default: AllTypes[k]["default"] }>,
		"default"
	>;
};
type BlockLogicInputDef = {
	readonly displayName: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly group?: string;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
};

export type BlockLogicNoConfigDefinitionTypes<TKeys extends PrimitiveKeys> = {
	readonly [k in TKeys]: OmitOverUnion<
		Extract<AllTypes[AllKeys], { readonly default: AllTypes[k]["default"] }>,
		"default" | "config"
	>;
};
type BlockLogicOutputDef = {
	readonly displayName: string;
	readonly types: Partial<BlockLogicNoConfigDefinitionTypes<PrimitiveKeys>>;
	readonly group?: string;
	readonly connectorHidden?: boolean;
};
export type BlockLogicBothDefinitions = {
	/** Visual order for the inputs */
	readonly inputOrder?: readonly string[];

	readonly input: { readonly [k in string]: BlockLogicInputDef };
	readonly output: { readonly [k in string]: BlockLogicOutputDef };
};

type BlockLogicFullDefinitionTypes<TKeys extends PrimitiveKeys> = {
	readonly [k in TKeys]: OmitOverUnion<
		Extract<AllTypes[AllKeys], { readonly default: AllTypes[k]["default"] }>,
		"default"
	>;
};
export type BlockLogicFullInputDef = {
	readonly displayName: string;
	readonly types: Partial<BlockLogicFullDefinitionTypes<PrimitiveKeys>>;
	readonly group?: string;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
};
export type BlockLogicFullBothDefinitions = {
	/** Visual order for the inputs */
	readonly inputOrder?: readonly string[];

	readonly input: { readonly [k in string]: BlockLogicFullInputDef };
	readonly output: { readonly [k in string]: BlockLogicOutputDef };
};

//

export type GenericBlockLogicCtor<TDef extends BlockLogicBothDefinitions = BlockLogicFullBothDefinitions> = new (
	block: PlacedBlockData,
	...args: any[]
) => GenericBlockLogic<TDef>;

export type GenericBlockLogic<TDef extends BlockLogicBothDefinitions = BlockLogicFullBothDefinitions> =
	BlockLogic<TDef>;

type TypedValue<TTypes extends PrimitiveKeys> = {
	readonly value: Primitives[TTypes]["default"] & defined;
	readonly type: TTypes;
};

//

type AllInputKeysToArgsObject<TDef extends BlockLogicBothDefinitions["input"]> = {
	readonly [k in keyof TDef]: (Primitives[keyof TDef[k]["types"] & PrimitiveKeys] & defined)["default"];
};
type AllInputKeysToTypesObject<TDef extends BlockLogicBothDefinitions["input"]> = {
	readonly [k in string & keyof TDef as `${k}Type`]: keyof TDef[k]["types"] & PrimitiveKeys;
};
export type AllInputKeysToObject<TDef extends BlockLogicBothDefinitions["input"]> = AllInputKeysToArgsObject<TDef> &
	AllInputKeysToTypesObject<TDef>;
export type AllOutputKeysToObject<TDef extends BlockLogicBothDefinitions["output"]> = {
	readonly [k in string & keyof TDef]: TypedValue<PrimitiveKeys & keyof TDef[k]["types"]>;
};

type ReadonlyBlockLogicValues<TDef extends BlockLogicBothDefinitions["output"]> = {
	readonly [k in keyof TDef]: ReadonlyLogicValueStorage<PrimitiveKeys & keyof (TDef[k]["types"] & defined)>;
};
type WriteonlyBlockLogicValues<TDef extends BlockLogicBothDefinitions["output"]> = {
	readonly [k in keyof TDef]: WriteonlyLogicValueStorage<PrimitiveKeys & keyof (TDef[k]["types"] & defined)>;
};
type IBlockLogicValues<TDef extends BlockLogicBothDefinitions["output"]> = {
	readonly [k in keyof TDef]: ILogicValueStorage<PrimitiveKeys & keyof (TDef[k]["types"] & defined)>;
};

const inputValuesToFullObject = <TDef extends BlockLogicBothDefinitions>(
	ctx: BlockLogicTickContext,
	input: ReadonlyBlockLogicValues<TDef["input"]>,
): AllInputKeysToObject<TDef["input"]> => {
	const inputValues = Objects.mapValues(input, (k, v) => v.get(ctx));

	// Map input values to an object with keys `{key}` being the values and `{key}Type` being the types
	const result: AllInputKeysToObject<TDef["input"]> = {
		...Objects.map(
			inputValues,
			(k) => k,
			(k, v) => v.value,
		),
		...Objects.map(
			inputValues,
			(k) => `${tostring(k)}Type`,
			(k, v) => v.type,
		),
	};

	return result;
};

export type BlockLogicTickContext = {
	readonly tick: number;
};
export type BlockLogicArgs = {
	readonly instance?: BlockModel;
};
export abstract class BlockLogic<TDef extends BlockLogicBothDefinitions> extends Component {
	private readonly _input: Writable<ReadonlyBlockLogicValues<TDef["input"]>>;
	protected readonly input: ReadonlyBlockLogicValues<TDef["input"]>;

	private readonly _output: IBlockLogicValues<TDef["output"]>;
	protected readonly output: WriteonlyBlockLogicValues<TDef["output"]>;

	private readonly ticked = new ArgsSignal<[ctx: BlockLogicTickContext]>();

	readonly instance?: BlockModel;

	constructor(
		readonly definition: TDef,
		args: BlockLogicArgs,
	) {
		super();

		this.instance = args.instance;
		if (args.instance) {
			ComponentInstance.init(this, args.instance);
		}

		this._input = Objects.mapValues(definition.input, () => UnsetBlockLogicValueStorage) as typeof this._input;
		this.input = this._input;

		this._output = Objects.mapValues(
			definition.output,
			(k, v) => new LogicValueStorageContainer<PrimitiveKeys>(v.types as Required<typeof v.types>),
		) as typeof this._output;
		this.output = this._output;
	}

	initializeInputs(config: PlacedBlockConfig, allBlocks: ReadonlyMap<BlockUuid, GenericBlockLogic>) {
		// explicit copying is needed
		for (const key of asMap(this.input).keys()) {
			if (!typeIs(key, "string")) {
				throw `Invalid key type ${typeOf(key)}`;
			}
			if (!(key in config)) {
				throw `Invalid block config provided; Key ${tostring(key)} was not found in config keys ${asMap(config).keys().join()}`;
			}

			const cfg = config[key];
			const def = this.definition.input[key].types[cfg.type];
			if (!def) continue;

			if (cfg.type === "wire") {
				const outputBlock = allBlocks.get(cfg.config.blockUuid);
				if (!outputBlock) {
					throw `Invalid connection to a nonexistent block ${cfg.config.blockUuid}`;
				}

				const output = outputBlock.output[cfg.config.connectionName];
				if (!output) {
					throw `Invalid connection to a nonexistent block ${cfg.config.blockUuid} output ${cfg.config.connectionName}`;
				}

				this.replaceInput(key, new BlockBackedInputLogicValueStorage(outputBlock, cfg.config.connectionName));
				continue;
			}

			if (cfg.type === "unset") {
				//

				continue;
			}

			const storageCtor = LogicValueStorages[def.type];
			const storage = new storageCtor(cfg.config as never);
			this.replaceInput(key, storage);
		}
	}

	replaceInput(
		key: keyof TDef["input"],
		value: ReadonlyLogicValueStorage<PrimitiveKeys & keyof TDef["input"][keyof TDef["input"]]["types"]>,
	) {
		if (!(key in this._input)) {
			throw `Key ${tostring(key)} is not in input definition (${asMap(this.definition.input).keys().join()})`;
		}

		this._input[key] = value;
	}

	getOutputValue(ctx: BlockLogicTickContext, key: keyof typeof this.output) {
		return this._output[key].get(ctx);
	}

	tick(ctx: BlockLogicTickContext) {
		this.ticked.Fire(ctx);
	}
	protected onTick(func: (ctx: BlockLogicTickContext) => void): void {
		this.ticked.Connect(func);
	}
	protected on(
		func: (
			ctx: BlockLogicTickContext,
			inputs: AllInputKeysToArgsObject<TDef["input"]> & AllInputKeysToTypesObject<TDef["input"]>,
		) => void,
	): void {
		this.onTick((ctx) => {
			const inputs = inputValuesToFullObject(ctx, this.input);
			func(ctx, inputs);
		});
	}
}

export type InstanceBlockLogicArgs = ReplaceWith<BlockLogicArgs, { readonly instance: BlockModel }>;
/** Block logic with a required block model instance */
export abstract class InstanceBlockLogic<
	TDef extends BlockLogicFullBothDefinitions,
	TBlock extends BlockModel = BlockModel,
> extends BlockLogic<TDef> {
	readonly instance: TBlock;

	constructor(definition: TDef, args: InstanceBlockLogicArgs) {
		super(definition, args);
		this.instance = args.instance as TBlock;
	}
}

/** Block logic that calculates its output only based on its logical inputs (ADD, MUX, converters, etc.) */
export abstract class CalculatableBlockLogic<TDef extends BlockLogicBothDefinitions> extends BlockLogic<TDef> {
	private cachedResults?: AllOutputKeysToObject<TDef["output"]>;
	private resultsCacheTick?: number;

	override getOutputValue(
		ctx: BlockLogicTickContext,
		key: keyof TDef["output"],
	): TypedValue<keyof BlockLogicTypes3.Primitives & keyof (TDef["output"][keyof TDef["output"]]["types"] & defined)> {
		this.recalculateOutputs(ctx);
		return super.getOutputValue(ctx, key);
	}

	private recalculateOutputs(ctx: BlockLogicTickContext): AllOutputKeysToObject<TDef["output"]> {
		if (ctx.tick === this.resultsCacheTick && this.cachedResults) {
			return this.cachedResults;
		}

		const inputs = inputValuesToFullObject(ctx, this.input);
		const result = this.calculate(inputs, ctx);
		this.cachedResults = result;
		this.resultsCacheTick = ctx.tick;

		for (const [k, v] of pairs(result)) {
			this.output[k].set(v.type, v.value as never);
		}

		return result;
	}

	protected abstract calculate(
		inputs: AllInputKeysToObject<TDef["input"]>,
		ctx: BlockLogicTickContext,
	): AllOutputKeysToObject<TDef["output"]>;
}

//

const adddef = {
	input: {
		value1: {
			displayName: "Value 1",
			types: {
				number: {
					type: "clampedNumber",
					config: 0,
					min: 0,
					max: 10,
					step: 1,
				},
			},
		},
		value2: {
			displayName: "Value 2",
			types: {
				number: {
					type: "clampedNumber",
					config: 0,
					min: 0,
					max: 10,
					step: 1,
				},
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: {
				number: {
					type: "clampedNumber",
					min: 0,
					max: 10,
					step: 1,
				},
			},
		},
	},
} as const satisfies BlockLogicBothDefinitions;
export class Add extends CalculatableBlockLogic<typeof adddef> {
	constructor(args: BlockLogicArgs) {
		super(adddef, args);
	}

	protected override calculate(
		inputs: AllInputKeysToObject<typeof adddef.input>,
	): AllOutputKeysToObject<typeof adddef.output> {
		return {
			result: {
				type: "number",
				value: inputs.value1 + inputs.value2,
			},
		};
	}
}
