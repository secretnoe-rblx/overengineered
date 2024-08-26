import { NumberObservableValue } from "shared/event/NumberObservableValue";
import type {
	BlockLogicTickContext,
	BlockLogic,
	BlockLogicBothDefinitions,
	BlockLogicNoConfigDefinitionTypes,
} from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export type BlockLogicValueResults = (typeof BlockLogicValueResults)[keyof typeof BlockLogicValueResults];
export const BlockLogicValueResults = {
	/** Indicates that the value is not yet available, but will be later. Any block receiving this should defer its execution until available. */
	availableLater: "$BLOCKLOGIC_AVAILABLELATER",

	/** Indicates that the value is not available and never will be. Any block receiving this should disable and destroy itself. */
	garbage: "$BLOCKLOGIC_GARBAGE",
} as const;

const blockLogicValueResultsBackwards = asObject(new Set(asMap(BlockLogicValueResults).map((k, v) => v)));
export const isCustomBlockLogicValueResult = (value: unknown): value is BlockLogicValueResults =>
	typeIs(value, "string") && value in blockLogicValueResultsBackwards;

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

type MiniPrimitives = { readonly [k in PrimitiveKeys]: Omit<Primitives[k], "config" | "default"> };

//

type Filter<K extends PrimitiveKeys> = {
	readonly filter: (value: Primitives[K]["default"], definition: MiniPrimitives[K]) => Primitives[K]["default"];
};
type GenericFilter = Filter<PrimitiveKeys>;
const Filters: { readonly [k in PrimitiveKeys]?: Filter<k> } = {
	number: {
		filter: (value, definition) => {
			if (definition.clamp) {
				const clamp = definition.clamp;
				return NumberObservableValue.clamp(value, clamp.min, clamp.max, clamp.step);
			}

			return value;
		},
	},
};
const filterValue = <TType extends PrimitiveKeys>(
	value: Primitives[TType]["default"],
	definitionTypes: Partial<BlockLogicNoConfigDefinitionTypes<TType>>,
	valueType: TType,
): Primitives[TType]["default"] => {
	if (!definitionTypes[valueType]) {
		throw "Trying to filter an unknown type";
	}

	const filter = Filters[valueType] as GenericFilter | undefined;
	if (!filter) return value;

	return filter.filter(value, definitionTypes[valueType]!);
};
const filterValueArr = <TType extends PrimitiveKeys>(
	value: Primitives[TType]["default"],
	definitionTypes: readonly TType[],
	valueType: TType,
): Primitives[TType]["default"] => {
	if (!definitionTypes.includes(valueType)) {
		throw "Trying to filter an unknown type";
	}

	const filter = Filters[valueType] as GenericFilter | undefined;
	if (!filter) return value;

	return filter.filter(value, {});
};

//

type TypedValue<TTypes extends PrimitiveKeys> = {
	readonly value: Primitives[TTypes]["default"] & defined;
	readonly type: TTypes;
	readonly changedSinceLastTick: boolean;
};

export type ReadonlyLogicValueStorage<TTypes extends PrimitiveKeys> = {
	get(ctx: BlockLogicTickContext): TypedValue<TTypes> | BlockLogicValueResults;
};
export type WriteonlyLogicValueStorage<TTypes extends PrimitiveKeys> = {
	set<TType extends TTypes & PrimitiveKeys>(valueType: TType, value: Primitives[TType]["default"]): void;
};
export type ILogicValueStorage<TTypes extends PrimitiveKeys> = ReadonlyLogicValueStorage<TTypes> &
	WriteonlyLogicValueStorage<TTypes>;

/** Storage for an output value of a block logic. */
export class LogicValueOutputStorageContainer<TType extends PrimitiveKeys>
	implements ReadonlyLogicValueStorage<TType>, WriteonlyLogicValueStorage<TType>
{
	private value?: Omit<TypedValue<TType>, "changedSinceLastTick">;
	private lastChangeTick?: number;
	private changedThisTick = false;

	get(ctx: BlockLogicTickContext): TypedValue<TType> | BlockLogicValueResults {
		if (!this.value) {
			return BlockLogicValueResults.availableLater;
		}

		if (this.changedThisTick) {
			this.changedThisTick = false;
			this.lastChangeTick = ctx.tick;
		}

		return {
			value: this.value.value,
			type: this.value.type,
			changedSinceLastTick: ctx.tick === this.lastChangeTick,
		};
	}
	set<TType2 extends TType>(valueType: TType2, value: Primitives[TType2]["default"]): void {
		this.changedThisTick = true;

		this.value = {
			type: valueType,
			value,
		};
	}
}
/** Storage for a value of a block logic. Automatically filters the value based on the type. */
export class FilteredLogicValueStorageContainer<
	TType extends PrimitiveKeys,
> extends LogicValueOutputStorageContainer<TType> {
	constructor(private readonly definitions: BlockLogicNoConfigDefinitionTypes<TType>) {
		super();
	}

	override set<TType2 extends TType>(valueType: TType2, value: Primitives[TType2]["default"]): void {
		value = filterValue(value, this.definitions, valueType);
		super.set(valueType, value);
	}
}

/** Storage for a value of a block logic that gets its value from another block output. Automatically filters the value based on the type. */
export class BlockBackedInputLogicValueStorage<TType extends PrimitiveKeys>
	implements ReadonlyLogicValueStorage<TType>
{
	constructor(
		private readonly block: BlockLogic<BlockLogicBothDefinitions>,
		private readonly key: string,
	) {}

	get(ctx: BlockLogicTickContext): TypedValue<TType> | BlockLogicValueResults {
		const result = this.block.getOutputValue(ctx, this.key);
		if (isCustomBlockLogicValueResult(result)) {
			return result;
		}

		const filtered = filterValueArr(result.value, this.block.definition.output[this.key].types, result.type);

		return {
			type: result.type,
			value: filtered,
			changedSinceLastTick: result.changedSinceLastTick,
		} as TypedValue<TType>;
	}
}

export const UnsetBlockLogicValueStorage: ReadonlyLogicValueStorage<PrimitiveKeys> = {
	get(): BlockLogicValueResults {
		return BlockLogicValueResults.garbage;
	},
};

//

const NewPrimitiveLogicValueStorage = <TType extends PrimitiveKeys>(valueType: TType) => {
	return class extends FilteredLogicValueStorageContainer<TType> {
		constructor(config: Primitives[TType]["config"], definition: Primitives[TType]) {
			super({ [valueType]: definition } as unknown as BlockLogicNoConfigDefinitionTypes<TType>);
			this.set(valueType, config);
		}
	};
};

type ConfigBackedLogicValueStorage<TType extends PrimitiveKeys> = ReadonlyLogicValueStorage<TType>;
type ConfigBackedLogicValueStorageCtor<TType extends PrimitiveKeys> = new (
	config: Primitives[TType]["config"],
	definition: Primitives[TType],
) => ConfigBackedLogicValueStorage<TType>;
export const LogicValueStorages: {
	readonly [k in Exclude<PrimitiveKeys, "wire" | "unset">]: ConfigBackedLogicValueStorageCtor<k>;
} = {
	number: NewPrimitiveLogicValueStorage("number"),
	bool: NewPrimitiveLogicValueStorage("bool"),
	key: NewPrimitiveLogicValueStorage("key"),
	vector3: NewPrimitiveLogicValueStorage("vector3"),
	string: NewPrimitiveLogicValueStorage("string"),
	color: NewPrimitiveLogicValueStorage("color"),
	byte: NewPrimitiveLogicValueStorage("byte"),
	bytearray: NewPrimitiveLogicValueStorage("bytearray"),
};
