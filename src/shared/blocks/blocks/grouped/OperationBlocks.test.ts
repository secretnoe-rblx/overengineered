import { Assert } from "shared/Assert";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import { MathUtils } from "shared/fixes/MathUtils";
import type { UnitTests } from "shared/test/TestFramework";

namespace BlockTests {
	function createBlock1(id: string, value: number, valuename?: string) {
		const [block] = BlockTesting.create([
			{
				id,
				config: {
					[valuename ?? "value"]: BlockTesting.num(value),
				},
			},
		]);
		return block;
	}
	function createBlock2(id: string, value1: number, value2: number, leftname?: string, rightname?: string) {
		const [block] = BlockTesting.create([
			{
				id,
				config: {
					[leftname ?? "value1"]: BlockTesting.num(value1),
					[rightname ?? "value2"]: BlockTesting.num(value2),
				},
			},
		]);
		return block;
	}

	export function constantBlocks() {
		const testConstant1 = (id: string, value: number, expectedResult: number) => {
			const block = createBlock1(id, value);
			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};
		const testConstant0 = (id: string, expectedResult: number) => {
			const [block] = BlockTesting.create([{ id, config: {} }]);
			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"value",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testConstant1("constant", 42, 42);
		testConstant0("pi", math.pi);
		testConstant0("e", MathUtils.e);
	}
	export function unaryMathBlocks() {
		const testUnary = (id: string, input: number, expectedResult: number) => {
			const block = createBlock1(id, input);
			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testUnary("abs", -5, math.abs(-5));
		testUnary("round", 4.7, math.round(4.7));
		testUnary("floor", 4.7, math.floor(4.7));
		testUnary("ceil", 4.1, math.ceil(4.1));
		testUnary("sign", -7, math.sign(-7));
		testUnary("sqrt", 16, math.sqrt(16));
	}
	export function binaryMathBlocks() {
		const testBinary = (
			id: string,
			left: number,
			right: number,
			expectedResult: number,
			leftname?: string,
			rightname?: string,
		) => {
			const block = createBlock2(id, left, right, leftname, rightname);
			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testBinary("add", 4, 9, 4 + 9);
		testBinary("sub", 4, 9, 4 - 9);
		testBinary("mul", 4, 9, 4 * 9);
		testBinary("div", 4, 9, 4 / 9);
		testBinary("mod", 10, 3, 10 % 3);
		testBinary("pow", 2, 3, math.pow(2, 3), "value", "power");
		testBinary("nsqrt", 16, 2, math.pow(16, 1 / 2), "value", "root");
	}
	export function complexMathBlocks() {
		const testTernary = (id: string, value: number, min: number, max: number, expectedResult: number) => {
			const [block] = BlockTesting.create([
				{
					id,
					config: {
						value: BlockTesting.num(value),
						min: BlockTesting.num(min),
						max: BlockTesting.num(max),
					},
				},
			]);

			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testTernary("clamp", 5, 1, 10, math.clamp(5, 1, 10));
		testTernary("clamp", 0, 1, 10, math.clamp(0, 1, 10));
		testTernary("clamp", 123, 1, 10, math.clamp(123, 1, 10));

		//

		const testBinaryComparison = (id: string, left: number, right: number, expectedResult: boolean) => {
			const block = createBlock2(id, left, right);
			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testBinaryComparison("equals", 5, 5, true);
		testBinaryComparison("notequals", 5, 10, true);
		testBinaryComparison("greaterthan", 10, 5, true);
		testBinaryComparison("lessthan", 5, 10, true);
		testBinaryComparison("greaterthanorequals", 10, 10, true);
		testBinaryComparison("lessthanorequals", 5, 5, true);
	}
	export function trigonometryBlocks() {
		const testTrigonometry = (id: string, input: number, expectedResult: number) => {
			const block = createBlock1(id, input);
			const runner = BlockTesting.runner(block);
			const result = BlockAssert.resultSuccess(block, runner, "result", `testing block ${id}`);

			Assert.almostEquals(result.value as number, expectedResult);
		};

		testTrigonometry("sin", math.pi / 2, math.sin(math.pi / 2));
		testTrigonometry("cos", math.pi, math.cos(math.pi));
		testTrigonometry("tan", math.pi / 4, math.tan(math.pi / 4));
		testTrigonometry("asin", 1, math.asin(1));
		testTrigonometry("acos", 1, math.acos(1));
		testTrigonometry("atan", 1, math.atan(1));
		testTrigonometry("deg", math.pi, (math.pi * 180) / math.pi);
		testTrigonometry("rad", 180, (180 * math.pi) / 180);
		testTrigonometry("log", 10, math.log(10));
		testTrigonometry("log10", 10, math.log10(10));
		testTrigonometry("loge", MathUtils.e, math.log(MathUtils.e));
	}
	export function vectorBlocks() {
		const testVector = (id: string, x: number, y: number, z: number, expectedResult: Vector3) => {
			const [block] = BlockTesting.create([
				{
					id,
					config: {
						value_x: BlockTesting.num(x),
						value_y: BlockTesting.num(y),
						value_z: BlockTesting.num(z),
					},
				},
			]);

			const runner = BlockTesting.runner(block);
			BlockAssert.resultSuccessAndEquals(
				block,
				runner,
				"result",
				{ value: expectedResult },
				`testing block ${id}`,
			);
		};

		testVector("vec3combiner", 1, 2, 3, new Vector3(1, 2, 3));

		const testVec3Splitter = (vector: Vector3, expectedX: number, expectedY: number, expectedZ: number) => {
			const id = "vec3splitter";
			const [block] = BlockTesting.create([
				{
					id,
					config: {
						value: BlockTesting.vector3(vector),
					},
				},
			]);
			const runner = BlockTesting.runner(block);

			BlockAssert.resultSuccessAndEquals(block, runner, "result_x", { value: expectedX }, `testing block ${id}`);
			BlockAssert.resultSuccessAndEquals(block, runner, "result_y", { value: expectedY }, `testing block ${id}`);
			BlockAssert.resultSuccessAndEquals(block, runner, "result_z", { value: expectedZ }, `testing block ${id}`);
		};

		testVec3Splitter(new Vector3(1, 2, 3), 1, 2, 3);
	}
	export function boolBlocks() {
		const testBool = (id: string, input1: boolean, input2: boolean | undefined, expected: boolean) => {
			const config =
				input2 !== undefined
					? { value1: BlockTesting.bool(input1), value2: BlockTesting.bool(input2) }
					: { value: BlockTesting.bool(input1) };
			const [block] = BlockTesting.create([{ id, config: config as never }]);
			const runner = BlockTesting.runner(block);

			BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: expected }, `testing block ${id}`);
		};

		testBool("not", true, undefined, false);
		testBool("and", true, true, true);
		testBool("or", true, false, true);
		testBool("xor", true, false, true);
		testBool("nand", true, true, false);
		testBool("nor", false, false, true);
		testBool("xnor", true, true, true);
	}
	export function otherBlocks() {
		const testBuffer = (value: number, expected: number) => {
			const id = "buffer";
			const block = createBlock1(id, value);
			const runner = BlockTesting.runner(block);

			BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: expected }, `testing block ${id}`);
		};

		testBuffer(42, 42);

		//

		const testMultiplexer = (state: boolean, trueValue: number, falseValue: number, expected: number) => {
			const id = "multiplexer";
			const [block] = BlockTesting.create([
				{
					id,
					config: {
						value: BlockTesting.bool(state),
						truevalue: BlockTesting.num(trueValue),
						falsevalue: BlockTesting.num(falseValue),
					},
				},
			]);
			const runner = BlockTesting.runner(block);

			BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: expected }, `testing block ${id}`);
		};

		testMultiplexer(true, 42, 0, 42);
		testMultiplexer(false, 42, 0, 0);
	}

	export function divisionByZeroReturningGarbage() {
		const block = createBlock2("div", 45978, 0);
		const runner = BlockTesting.runner(block);

		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.garbage, `testing block div`);
	}
}
export const _Tests: UnitTests = { BlockTests };
