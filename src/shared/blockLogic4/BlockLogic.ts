import { Assert } from "shared/Assert";
import { BlockLogicValueResults, isCustomBlockLogicValueResult } from "shared/blockLogic/BlockLogicValueStorage";
import { ArgsSignal } from "shared/event/Signal";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

type ValueByType<T extends PrimitiveKeys> = Primitives[T]["default"] & defined;
interface TypedLogicValue<TTypes extends PrimitiveKeys> {
	readonly value: Primitives[TTypes]["default"] & defined;
	readonly type: TTypes;
	readonly changedThisTick: boolean;
}
type BlockLogicValueReturn<K extends PrimitiveKeys = PrimitiveKeys> = TypedLogicValue<K> | BlockLogicValueResults;

interface IReadonlyBlockLogic {
	getOutput(key: string): BlockLogicValueReturn<PrimitiveKeys>;
}
interface IBlockLogic extends IReadonlyBlockLogic {
	// tick(): void;
}

interface IReadonlyBlockLogicValueStorage {
	get(): BlockLogicValueReturn<PrimitiveKeys>;
}
interface IBlockLogicValueStorage extends IReadonlyBlockLogicValueStorage {
	set(valueType: PrimitiveKeys, value: ValueByType<PrimitiveKeys>): void;
}

interface IReadonlyBlockLogicRunner {
	getTick(): number;
	// getDt(): number;
}
interface IBlockLogicRunner extends IReadonlyBlockLogicRunner {
	tick(): void;
}

interface BlockLogicArgs {
	readonly runner: IReadonlyBlockLogicRunner;
}

type BlockInputToValueObject<K extends PrimitiveKeys> = { readonly [k in string]: ValueByType<K> };
type BlockInputToTypeObject<K extends PrimitiveKeys> = { readonly [k in `${string}Type`]: ValueByType<K> };
type BlockInputToChangedObject<K extends PrimitiveKeys> = { readonly [k in `${string}Changed`]: ValueByType<K> };
type BlockInputToObject<K extends PrimitiveKeys = PrimitiveKeys> = BlockInputToValueObject<K> &
	BlockInputToTypeObject<K> &
	BlockInputToChangedObject<K>;

const uninitializedInput: IReadonlyBlockLogicValueStorage = {
	get() {
		return BlockLogicValueResults.availableLater;
	},
};
abstract class BlockLogic implements IReadonlyBlockLogic {
	readonly input: { readonly [k in string]: IReadonlyBlockLogicValueStorage };
	readonly output: { readonly [k in string]: IBlockLogicValueStorage };

	private readonly runner: IReadonlyBlockLogicRunner;

	constructor(args: BlockLogicArgs) {
		this.runner = args.runner;

		this.input = {
			value: uninitializedInput,
		};
		this.output = {
			result: new BlockLogicValueStorage(this.runner),
		};
	}

	getOutput(key: string): BlockLogicValueReturn<PrimitiveKeys> {
		this.recalculate();
		return this.output[key].get();
	}

	private lastRecalcTick?: number;
	private recalculate() {
		if (this.lastRecalcTick === this.runner.getTick()) {
			return;
		}

		this.lastRecalcTick = this.runner.getTick();
		this.recalculated.Fire();
	}
	private readonly recalculated = new ArgsSignal();
	private onRecalc(func: () => void): SignalConnection {
		return this.recalculated.Connect(func);
	}

	protected onRecalcFullInput(func: (input: BlockInputToObject) => void): SignalConnection {
		return this.onRecalcInput(asMap(this.input).keys(), func);
	}
	protected onRecalcInput(keys: readonly string[], func: (input: BlockInputToObject) => void): SignalConnection {
		if (keys.size() === 0) {
			return this.onRecalc(() => func({}));
		}

		return this.onRecalc(() => {
			const input: { [k in string]: unknown } = {};
			let anyChanged = false;

			for (const k of keys) {
				const value = this.input[k].get();
				if (isCustomBlockLogicValueResult(value)) {
					return;
				}

				anyChanged ||= value.changedThisTick;

				input[k] = value.value;
				input[`${k}Type`] = value.type;
				input[`${k}Changed`] = value.changedThisTick;
			}

			if (!anyChanged) return;
			func(input as BlockInputToObject);
		});
	}
}

class BlockLogicValueStorage implements IBlockLogicValueStorage {
	private value?: ValueByType<PrimitiveKeys>;
	private valueType?: PrimitiveKeys;
	private lastChangedTick?: number;

	constructor(private readonly runner: IReadonlyBlockLogicRunner) {}

	set(valueType: PrimitiveKeys, value: ValueByType<PrimitiveKeys>): void {
		this.valueType = valueType;
		this.value = value;

		this.lastChangedTick = this.runner.getTick();
	}
	get(): BlockLogicValueReturn<PrimitiveKeys> {
		if (this.value === undefined || this.valueType === undefined) {
			return BlockLogicValueResults.availableLater;
		}

		return {
			value: this.value,
			type: this.valueType,
			changedThisTick: this.runner.getTick() === this.lastChangedTick,
		};
	}
}
class BlockBackedValueStorage implements IReadonlyBlockLogicValueStorage {
	constructor(
		private readonly block: BlockLogic,
		private readonly key: string,
	) {}

	get(): BlockLogicValueReturn<PrimitiveKeys> {
		return this.block.getOutput(this.key);
	}
}

class BlockRunner implements IReadonlyBlockLogicRunner {
	private tickNumber: number = 0;

	getTick(): number {
		return this.tickNumber;
	}

	tick(): void {
		this.tickNumber++;
	}
}

//

namespace BlockAssert {
	export function resultSuccess(
		block: BlockLogic,
		runner: IReadonlyBlockLogicRunner,
		outputName: string,
		message?: string,
	) {
		const result = block.getOutput(outputName);
		Assert.isNot(
			result,
			"string",
			`${message}; Value is ${result}, while expected success on tick ${runner.getTick()}`,
		);

		return result;
	}
	export function resultSuccessAndEquals(
		block: BlockLogic,
		runner: IReadonlyBlockLogicRunner,
		outputName: string,
		properties: Partial<TypedLogicValue<PrimitiveKeys>>,
		message?: string,
	) {
		const result = resultSuccess(block, runner, outputName, message);
		Assert.propertiesEqual(result, properties, `${message} (tick ${runner.getTick()})`);
	}

	export function resultError(
		block: BlockLogic,
		runner: IReadonlyBlockLogicRunner,
		outputName: string,
		vresult: BlockLogicValueResults,
		message?: string,
	) {
		const result = block.getOutput(outputName);
		Assert.equals(result, vresult, `${message} (tick ${runner.getTick()})`);
	}
}
export namespace BL4 {
	export function testBasic1() {
		const runner = new BlockRunner();
		const args = { runner };

		class Block4 extends BlockLogic {
			constructor(args: BlockLogicArgs) {
				super(args);
				this.output.result.set("number", 4);
			}
		}

		const b1 = new Block4(args);

		BlockAssert.resultSuccessAndEquals(b1, runner, "result", { value: 4, changedThisTick: true });

		runner.tick();
		BlockAssert.resultSuccessAndEquals(b1, runner, "result", { value: 4, changedThisTick: false });
	}
	export function testBasic2() {
		const runner = new BlockRunner();
		const args = { runner };

		class Block4 extends BlockLogic {
			constructor(args: BlockLogicArgs) {
				super(args);
				this.output.result.set("number", 4);
			}
		}
		class BlockAdd1 extends BlockLogic {
			constructor(args: BlockLogicArgs) {
				super(args);

				this.onRecalcFullInput(({ value, valueChanged }) => {
					this.output.result.set("number", (value as number) + 1);
				});
			}
		}

		const b1 = new Block4(args);
		const b2 = new BlockAdd1(args);

		(b2.input as Writable<typeof b1.input>).value = new BlockBackedValueStorage(b1, "result");

		BlockAssert.resultSuccessAndEquals(b1, runner, "result", { value: 4, changedThisTick: true });
		BlockAssert.resultSuccessAndEquals(b2, runner, "result", { value: 5, changedThisTick: true });

		runner.tick();
		BlockAssert.resultSuccessAndEquals(
			b1,
			runner,
			"result",
			{ value: 4, changedThisTick: false },
			"Result shoud not be considered changedThisTick anymore",
		);
		BlockAssert.resultSuccessAndEquals(
			b2,
			runner,
			"result",
			{ value: 5, changedThisTick: false },
			"Result shoud not be considered changedThisTick anymore",
		);
	}
	export function testCircular() {
		const runner = new BlockRunner();
		const args = { runner };

		class BlockNumber4 extends BlockLogic {
			constructor(args: BlockLogicArgs) {
				super(args);
				this.onRecalcFullInput(({ value }) => this.output.result.set("number", value));
			}
		}
		const b1 = new BlockNumber4(args);
		const b2 = new BlockNumber4(args);

		(b1.input as Writable<typeof b1.input>).value = new BlockBackedValueStorage(b2, "result");
		(b2.input as Writable<typeof b2.input>).value = new BlockBackedValueStorage(b1, "result");

		BlockAssert.resultError(b1, runner, "result", BlockLogicValueResults.garbage);
		BlockAssert.resultError(b2, runner, "result", BlockLogicValueResults.garbage);

		runner.tick();
		BlockAssert.resultError(b1, runner, "result", BlockLogicValueResults.garbage);
		BlockAssert.resultError(b2, runner, "result", BlockLogicValueResults.garbage);
	}
}
