import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { Keys } from "shared/fixes/Keys";
import type { BlockConfigPrimitiveByType } from "shared/blockLogic/BlockConfig";
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
type NonPrimitives = BlockLogicTypes.NonPrimitives;
type AllTypes = BlockLogicTypes.Types;
type MiniPrimitives = { readonly [k in PrimitiveKeys]: Omit<Primitives[k], "config" | "default"> };
type MiniNonPrimitives = { readonly [k in NonPrimitiveKeys]: Omit<NonPrimitives[k], "config" | "default"> };
type MiniAllTypes = { readonly [k in AllKeys]: Omit<AllTypes[k], "config" | "default"> };
type PrimitiveKeys = keyof Primitives;
type NonPrimitiveKeys = keyof NonPrimitives;
type AllKeys = keyof AllTypes;

//

type Filter<K extends NonPrimitiveKeys> = {
	readonly filter: (
		value: NonPrimitives[K]["default"],
		definition: MiniNonPrimitives[K],
	) => NonPrimitives[K]["default"];
};
const Filters: { readonly [k in NonPrimitiveKeys]: Filter<k> } = {
	clampedNumber: {
		filter: (value, definition) =>
			NumberObservableValue.clamp(value, definition.min, definition.max, definition.step),
	},
	keybool: {
		filter: (value) => value,
	},
};
const filterValue = <TType extends PrimitiveKeys>(
	value: Primitives[TType]["default"],
	definitions: Partial<BlockLogicNoConfigDefinitionTypes<TType>>,
	valueType: AllKeys,
): Primitives[TType]["default"] => {
	if (valueType in definitions) {
		const def = definitions[valueType as TType];
		return filterValueByDef(value, def as never);
	}

	return value;
};
const filterValueByDef = <TType extends AllKeys>(
	value: AllTypes[TType]["default"],
	definition: AllTypes[TType] | undefined,
): AllTypes[TType]["default"] => {
	if (definition && definition.type in Filters) {
		const filter = Filters[definition.type as keyof typeof Filters];
		return filter.filter(value as never, definition as never);
	}

	return value;
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

/** Storage for a value of a block logic. Automatically filters the value based on the type. */
export class LogicValueStorageContainer<TType extends PrimitiveKeys>
	implements ReadonlyLogicValueStorage<TType>, WriteonlyLogicValueStorage<TType>
{
	private value?: Omit<TypedValue<TType>, "changedSinceLastTick">;
	private lastChangeTick?: number;
	private changedThisTick = false;

	constructor(private readonly definitions: BlockLogicNoConfigDefinitionTypes<TType>) {}

	get(ctx: BlockLogicTickContext): TypedValue<TType> | BlockLogicValueResults {
		if (!this.value) {
			return BlockLogicValueResults.availableLater;
		}

		if (this.changedThisTick) {
			this.changedThisTick = false;
			this.lastChangeTick = ctx.tick;
		}

		let value = this.value.value;
		const valueType = this.value.type;
		const changedSinceLastTick = ctx.tick === this.lastChangeTick;

		value = filterValue(value, this.definitions, valueType);

		return { value, type: valueType, changedSinceLastTick };
	}
	set<TType2 extends TType & PrimitiveKeys>(valueType: TType2, value: Primitives[TType2]["default"]): void {
		value = filterValue(value, this.definitions, valueType);
		this.changedThisTick = true;

		this.value = {
			type: valueType,
			value,
		};
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

		const filtered = filterValue(result.value, this.block.definition.output[this.key].types, result.type);

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

namespace LogicValueStoragesNamespace {
	export type Base<TType extends AllKeys> = ReadonlyLogicValueStorage<BlockConfigPrimitiveByType<TType>>;

	const NewPrimitiveLogicValueStorage = <TType extends PrimitiveKeys>(valueType: TType) => {
		return class implements Base<TType> {
			constructor(private readonly config: AllTypes[TType]["config"]) {}

			get(): TypedValue<BlockConfigPrimitiveByType<TType>> {
				return {
					type: valueType as never,
					value: this.config,

					// configuration values never change
					changedSinceLastTick: false,
				};
			}
		};
	};

	export class unset implements Base<"unset"> {
		get() {
			$warn("Trying to get a value from the type unset");
			return BlockLogicValueResults.garbage;
		}
	}
	export class wire implements Base<"wire"> {
		get() {
			$warn("Trying to get a value from the type wire");
			return BlockLogicValueResults.garbage;
		}
	}

	export const _number = NewPrimitiveLogicValueStorage("number");
	export const bool = NewPrimitiveLogicValueStorage("bool");
	export const key = NewPrimitiveLogicValueStorage("key");
	export const vector3 = NewPrimitiveLogicValueStorage("vector3");
	export const _string = NewPrimitiveLogicValueStorage("string");
	export const color = NewPrimitiveLogicValueStorage("color");
	export const byte = NewPrimitiveLogicValueStorage("byte");
	export const bytearray = NewPrimitiveLogicValueStorage("bytearray");

	export class clampedNumber extends LogicValueStorageContainer<BlockConfigPrimitiveByType<"clampedNumber">> {
		constructor(
			protected readonly config: Primitives[BlockConfigPrimitiveByType<"clampedNumber">]["config"],
			private readonly definition: AllTypes["clampedNumber"],
		) {
			super({ number: definition });
		}

		protected getValue(ctx: BlockLogicTickContext): number {
			return filterValueByDef<"clampedNumber">(this.config, this.definition);
		}
	}

	export class keybool extends LogicValueStorageContainer<BlockConfigPrimitiveByType<"keybool">> {
		constructor(config: AllTypes["keybool"]["config"], definition: AllTypes["keybool"]) {
			super({ bool: definition });

			this.set("bool", config.reversed);

			const isKeyCode = (key: string): key is KeyCode => key in Keys;
			if (isKeyCode(config.key)) {
				// if (config.switch) {
				// 	this.event.onKeyDown(this.config.key, () => (this.value = !this.value));
				// } else {
				// 	this.event.onKeyDown(this.config.key, () => (this.value = !config.reversed));
				// 	this.event.onKeyUp(this.config.key, () => (this.value = config.reversed));
				// }
			}
		}
	}
}
type ConfigBackedLogicValueStorage<TType extends AllKeys> = LogicValueStoragesNamespace.Base<TType>;
type ConfigBackedLogicValueStorageCtor<TType extends AllKeys> = new (
	config: AllTypes[TType]["config"],
	definition: AllTypes[TType],
) => ConfigBackedLogicValueStorage<TType>;
export const LogicValueStorages: { readonly [k in AllKeys]: ConfigBackedLogicValueStorageCtor<k> } = {
	...LogicValueStoragesNamespace,
	number: LogicValueStoragesNamespace._number,
	string: LogicValueStoragesNamespace._string,
};
