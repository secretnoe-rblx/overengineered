import {
	BlockBackedInputLogicValueStorage,
	isCustomBlockLogicValueResult,
	LogicValueStorages,
	UnsetBlockLogicValueStorage,
	LogicValueOutputStorageContainer,
} from "shared/blockLogic/BlockLogicValueStorage";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ArgsSignal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type {
	ReadonlyLogicValueStorage,
	WriteonlyLogicValueStorage,
	ILogicValueStorage,
} from "shared/blockLogic/BlockLogicValueStorage";

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

export type BlockLogicWithConfigDefinitionTypes<TKeys extends PrimitiveKeys> = {
	readonly [k in TKeys]: OmitOverUnion<Primitives[k], "default">;
};

type BlockLogicInputDef = {
	readonly displayName: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly group?: string;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
};

export type BlockLogicNoConfigDefinitionTypes<TKeys extends PrimitiveKeys> = {
	readonly [k in TKeys]: OmitOverUnion<Primitives[k], "default" | "config">;
};
type BlockLogicOutputDef = {
	readonly displayName: string;
	readonly types: readonly PrimitiveKeys[];
	readonly group?: string;
	readonly connectorHidden?: boolean;
};

export type BlockLogicInputDefs = { readonly [k in string]: BlockLogicInputDef };
export type BlockLogicOutputDefs = { readonly [k in string]: BlockLogicOutputDef };

export type BlockLogicBothDefinitions = {
	/** Visual order for the inputs */
	readonly inputOrder?: readonly string[];

	/** Visual order for the outputs (wire markers) */
	readonly outputOrder?: readonly string[];

	readonly input: BlockLogicInputDefs;
	readonly output: BlockLogicOutputDefs;
};

export type BlockLogicFullInputDef = {
	readonly displayName: string;
	readonly tooltip?: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly group?: string;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
};
export type BlockLogicFullOutputDef = BlockLogicOutputDef;
export type BlockLogicFullBothDefinitions = {
	/** Visual order for the inputs */
	readonly inputOrder?: readonly string[];

	/** Visual order for the outputs (wire markers) */
	readonly outputOrder?: readonly string[];

	readonly input: { readonly [k in string]: BlockLogicFullInputDef };
	readonly output: { readonly [k in string]: BlockLogicFullOutputDef };
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
	readonly changedSinceLastTick: boolean;
};

//

type AllInputKeysToArgsObject<TDef extends BlockLogicInputDefs, TKeys extends keyof TDef = keyof TDef> = {
	readonly [k in TKeys]: (Primitives[keyof TDef[k]["types"] & PrimitiveKeys] & defined)["default"];
};
type AllInputKeysToTypesObject<TDef extends BlockLogicInputDefs, TKeys extends keyof TDef = keyof TDef> = {
	readonly [k in string & TKeys as `${k}Type`]: keyof TDef[k]["types"] & PrimitiveKeys;
};
type AllInputKeysToChangedObject<TDef extends BlockLogicInputDefs, TKeys extends keyof TDef = keyof TDef> = {
	readonly [k in string & TKeys as `${k}Changed`]: boolean;
};
export type AllInputKeysToObject<
	TDef extends BlockLogicInputDefs,
	TKeys extends keyof TDef = keyof TDef,
> = AllInputKeysToArgsObject<TDef, TKeys> &
	AllInputKeysToTypesObject<TDef, TKeys> &
	AllInputKeysToChangedObject<TDef, TKeys>;

export type AllOutputKeysToObject<TDef extends BlockLogicOutputDefs> = {
	readonly [k in string & keyof TDef]: Omit<TypedValue<TDef[k]["types"][number]>, "changedSinceLastTick">;
};

type ReadonlyBlockLogicValues<TDef extends BlockLogicInputDefs> = {
	readonly [k in keyof TDef]: ReadonlyLogicValueStorage<PrimitiveKeys & keyof (TDef[k]["types"] & defined)>;
};
type WriteonlyBlockLogicValues<TDef extends BlockLogicOutputDefs> = {
	readonly [k in keyof TDef]: WriteonlyLogicValueStorage<PrimitiveKeys & TDef[k]["types"][number]>;
};
type IBlockLogicValues<TDef extends BlockLogicOutputDefs> = {
	readonly [k in keyof TDef]: ILogicValueStorage<PrimitiveKeys & keyof (TDef[k]["types"] & defined)>;
};

const inputValuesToFullObject = <TDef extends BlockLogicBothDefinitions, TCheckUnchanged extends boolean>(
	ctx: BlockLogicTickContext,
	input: ReadonlyBlockLogicValues<TDef["input"]>,
	keys: ReadonlySet<keyof TDef["input"]> | undefined,
	checkUnchanged: TCheckUnchanged,
):
	| AllInputKeysToObject<TDef["input"]>
	| BlockLogicValueResults
	| (TCheckUnchanged extends true ? "$UNCHANGED" : never) => {
	const inputValues: {
		[k in keyof TDef["input"]]?: TypedValue<
			PrimitiveKeys & keyof (TDef["input"][keyof TDef["input"]]["types"] & defined)
		>;
	} = {};

	let anyChanged = false;
	for (const [k] of pairs(keys ? asObject(keys) : input)) {
		const value = input[k].get(ctx);
		if (isCustomBlockLogicValueResult(value)) {
			return value;
		}

		if (value.changedSinceLastTick) {
			anyChanged = true;
		}

		inputValues[k] = value;
	}

	if (checkUnchanged && !anyChanged) {
		return "$UNCHANGED" as never;
	}

	// Map input values to an object with keys `{key}` being the values, `{key}Type` being the types, `{key}Changed` being true if the value was changed
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
		...Objects.map(
			inputValues,
			(k) => `${tostring(k)}Changed`,
			(k, v) => v.changedSinceLastTick,
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
	readonly input: ReadonlyBlockLogicValues<TDef["input"]>;

	private readonly _output: IBlockLogicValues<TDef["output"]>;
	readonly output: WriteonlyBlockLogicValues<TDef["output"]>;

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
			() => new LogicValueOutputStorageContainer<PrimitiveKeys>(),
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

			const def = this.definition.input[key].types[cfg.type];
			if (!def) continue;

			const storageCtor = LogicValueStorages[cfg.type];
			const storage = new storageCtor(cfg.config as never, def as never);
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

	private calculatingRightNow = false;
	getOutputValue(
		ctx: BlockLogicTickContext,
		key: keyof typeof this.output,
	): TypedValue<TDef["output"][keyof TDef["output"]]["types"][number]> | BlockLogicValueResults {
		if (this.calculatingRightNow) {
			this.disableAndBurn();
			return BlockLogicValueResults.garbage;
		}

		this.calculatingRightNow = true;
		const value = this._output[key].get(ctx);
		this.calculatingRightNow = false;

		return value;
	}

	tick(ctx: BlockLogicTickContext) {
		this.ticked.Fire(ctx);
	}
	protected onTick(func: (ctx: BlockLogicTickContext) => void): void {
		this.ticked.Connect(func);
	}

	private onInputs<const TKeys extends keyof TDef["input"]>(
		keys: readonly TKeys[] | undefined,
		func: (inputs: AllInputKeysToObject<TDef["input"], TKeys>, ctx: BlockLogicTickContext) => void,
		skipIfUnchanged = true,
	): void {
		const keysSet = keys && new Set(keys);

		this.onTick((ctx) => {
			const inputs = inputValuesToFullObject(ctx, this.input, keysSet, skipIfUnchanged);
			if (inputs === BlockLogicValueResults.garbage) {
				this.disableAndBurn();
				return;
			}
			if (inputs === BlockLogicValueResults.availableLater) {
				return;
			}
			if (skipIfUnchanged && inputs === "$UNCHANGED") {
				return;
			}

			func(inputs as never, ctx);
		});
	}
	/** Runs the provided function when any of the input values change, but only if all of them are available. */
	protected on(func: (inputs: AllInputKeysToObject<TDef["input"]>, ctx: BlockLogicTickContext) => void): void {
		this.onInputs(undefined, func);
	}
	/** Runs the provided function on every tick, but only if all of the input values are available. */
	protected onAlways(func: (inputs: AllInputKeysToObject<TDef["input"]>, ctx: BlockLogicTickContext) => void): void {
		this.onInputs(undefined, func, false);
	}
	/** Runs the provided function when any of the provided input values change, but only if all of them are available. */
	protected onk<const TKeys extends keyof TDef["input"]>(
		keys: readonly TKeys[],
		func: (inputs: AllInputKeysToObject<TDef["input"], TKeys>, ctx: BlockLogicTickContext) => void,
	): void {
		this.onInputs(keys, func);
	}

	disableAndBurn(): void {
		if (this.instance?.PrimaryPart) {
			RemoteEvents.Burn.send([this.instance?.PrimaryPart]);
		}

		this.disable();
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

	private calculatingRightNow2 = false;
	override getOutputValue(
		ctx: BlockLogicTickContext,
		key: keyof TDef["output"],
	): TypedValue<TDef["output"][keyof TDef["output"]]["types"][number]> | BlockLogicValueResults {
		if (this.calculatingRightNow2) {
			this.disableAndBurn();
			return BlockLogicValueResults.garbage;
		}

		this.calculatingRightNow2 = true;
		this.recalculateOutputs(ctx);
		this.calculatingRightNow2 = false;

		return super.getOutputValue(ctx, key);
	}

	private recalculateOutputs(
		ctx: BlockLogicTickContext,
	): AllOutputKeysToObject<TDef["output"]> | BlockLogicValueResults {
		if (ctx.tick === this.resultsCacheTick && this.cachedResults) {
			return this.cachedResults;
		}

		const inputs = inputValuesToFullObject(ctx, this.input, undefined, true);
		if (isCustomBlockLogicValueResult(inputs)) {
			return inputs;
		}
		if (inputs === "$UNCHANGED") {
			if (!this.cachedResults) {
				throw "Block inputs returned $UNCHANGED on the first tick";
			}

			return this.cachedResults;
		}

		const result = this.calculate(inputs, ctx);
		if (isCustomBlockLogicValueResult(result)) {
			return result;
		}

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
	): AllOutputKeysToObject<TDef["output"]> | BlockLogicValueResults;
}
