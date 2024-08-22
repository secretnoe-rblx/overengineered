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
) => {
	if (valueType in definitions) {
		const def = definitions[valueType as TType];
		if (def && def.type in Filters) {
			const filter = Filters[def.type as keyof typeof Filters];
			return filter.filter(value as never, def as never);
		}
	}

	return value;
};

//

type TypedValue<TTypes extends PrimitiveKeys> = {
	readonly value: Primitives[TTypes]["default"] & defined;
	readonly type: TTypes;
};

export type ReadonlyLogicValueStorage<TTypes extends PrimitiveKeys> = {
	isValueSet(): boolean;
	get(ctx: BlockLogicTickContext): TypedValue<TTypes>;
};
export type WriteonlyLogicValueStorage<TTypes extends PrimitiveKeys> = {
	set<TType extends TTypes & PrimitiveKeys>(valueType: TType, value: Primitives[TType]["default"]): void;
};
export type ILogicValueStorage<TTypes extends PrimitiveKeys> = ReadonlyLogicValueStorage<TTypes> &
	WriteonlyLogicValueStorage<TTypes>;

namespace LogicValueStoragesNamespace {
	export type Base<TType extends AllKeys> = ReadonlyLogicValueStorage<BlockConfigPrimitiveByType<TType>>;
	abstract class base<TType extends AllKeys> implements Base<TType> {
		constructor(
			protected readonly config: AllTypes[TType]["config"],
			private readonly valueType: BlockConfigPrimitiveByType<TType>,
		) {}

		isValueSet(): boolean {
			return true;
		}

		/** @sealed */
		get(ctx: BlockLogicTickContext): TypedValue<BlockConfigPrimitiveByType<TType>> {
			return {
				type: this.valueType,
				value: this.getValue(ctx),
			};
		}
		protected abstract getValue(
			ctx: BlockLogicTickContext,
		): Primitives[BlockConfigPrimitiveByType<TType>]["config"];
	}
	const NewPrimitiveLogicValueStorage = <TType extends PrimitiveKeys>(valueType: TType) => {
		return class implements Base<TType> {
			constructor(private readonly config: AllTypes[TType]["config"]) {}

			isValueSet(): boolean {
				return true;
			}

			get(): TypedValue<BlockConfigPrimitiveByType<TType>> {
				return {
					type: valueType as never,
					value: this.config,
				};
			}
		};
	};

	export class unset extends base<"unset"> {
		constructor(protected readonly config: AllTypes["unset"]["config"]) {
			super(config, "unset");
		}

		protected getValue(ctx: BlockLogicTickContext): { readonly ___nominal: "Unset" } {
			throw "Method not implemented.";
		}
	}
	export class wire extends base<"wire"> {
		constructor(protected readonly config: AllTypes["wire"]["config"]) {
			super(config, "wire");
		}

		protected getValue(ctx: BlockLogicTickContext): BlockLogicTypes.WireValue {
			throw "Method not implemented.";
		}
	}

	//export const unset = NewPrimitiveLogicValueStorage("unset");
	//export const wire = NewPrimitiveLogicValueStorage("wire");
	export const _number = NewPrimitiveLogicValueStorage("number");
	export const bool = NewPrimitiveLogicValueStorage("bool");
	export const key = NewPrimitiveLogicValueStorage("key");
	export const vector3 = NewPrimitiveLogicValueStorage("vector3");
	export const _string = NewPrimitiveLogicValueStorage("string");
	export const color = NewPrimitiveLogicValueStorage("color");
	export const byte = NewPrimitiveLogicValueStorage("byte");
	export const bytearray = NewPrimitiveLogicValueStorage("bytearray");

	export class clampedNumber extends base<"clampedNumber"> {
		constructor(protected readonly config: Primitives[BlockConfigPrimitiveByType<"clampedNumber">]["config"]) {
			super(config, "number");
		}

		protected getValue(ctx: BlockLogicTickContext): number {
			throw "Method not implemented.";
		}
	}

	export class keybool extends base<"keybool"> {
		private value: boolean;

		constructor(protected readonly config: AllTypes["keybool"]["config"]) {
			super(config, "bool");

			this.value = config.reversed;

			const isKeyCode = (key: string): key is KeyCode => key in Keys;
			if (isKeyCode(this.config.key)) {
				// if (config.switch) {
				// 	this.event.onKeyDown(this.config.key, () => (this.value = !this.value));
				// } else {
				// 	this.event.onKeyDown(this.config.key, () => (this.value = !config.reversed));
				// 	this.event.onKeyUp(this.config.key, () => (this.value = config.reversed));
				// }
			}
		}

		protected getValue(): boolean {
			return this.value;
		}
	}
}
type ConfigBackedLogicValueStorage<TType extends AllKeys> = LogicValueStoragesNamespace.Base<TType>;
type ConfigBackedLogicValueStorageCtor<TType extends AllKeys> = new (
	config: AllTypes[TType]["config"],
) => ConfigBackedLogicValueStorage<TType>;
export const LogicValueStorages: { readonly [k in AllKeys]: ConfigBackedLogicValueStorageCtor<k> } = {
	...LogicValueStoragesNamespace,
	number: LogicValueStoragesNamespace._number,
	string: LogicValueStoragesNamespace._string,
};

/** Storage for a value of a block logic. Automatically filters the value based on the type. */
export class LogicValueStorageContainer<TType extends PrimitiveKeys>
	implements ReadonlyLogicValueStorage<TType>, WriteonlyLogicValueStorage<TType>
{
	private value?: TypedValue<TType>;

	constructor(private readonly definitions: BlockLogicNoConfigDefinitionTypes<TType>) {}

	isValueSet(): boolean {
		return this.value !== undefined;
	}

	get(ctx: BlockLogicTickContext): TypedValue<TType> {
		if (!this.isValueSet() || !this.value) {
			throw `Block logic value was not set (keys: ${asMap(this.definitions).keys().join()})`;
		}

		let value = this.value.value;
		const valueType = this.value.type;

		value = filterValue(value, this.definitions, valueType);

		return { value, type: valueType };
	}
	set<TType2 extends TType & PrimitiveKeys>(valueType: TType2, value: Primitives[TType2]["default"]): void {
		value = filterValue(value, this.definitions, valueType);

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

	isValueSet(): boolean {
		return true;
	}

	get(ctx: BlockLogicTickContext): TypedValue<TType> {
		const result = this.block.getOutputValue(ctx, this.key);
		const filtered = filterValue(result.value, this.block.definition.output[this.key].types, result.type);

		return {
			type: result.type,
			value: filtered,
		} as TypedValue<TType>;
	}
}

export const UnsetBlockLogicValueStorage: ReadonlyLogicValueStorage<PrimitiveKeys> = {
	isValueSet(): boolean {
		return false;
	},
	get(): never {
		throw "Block logic value was not initialized (SHOULD NOT HAPPEN; REPORT TO THE DEVELOPERS)";
	},
};
