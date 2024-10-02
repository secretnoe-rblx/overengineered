import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import type { UnitTests } from "engine/shared/TestFramework";

namespace BlockTests {
	export function delayBlockNonTickBased() {
		const [block] = BlockTesting.create([
			{
				id: "delayblock",
				config: {
					value: BlockTesting.num(727),
					duration: BlockTesting.num(1),
					tickBased: BlockTesting.bool(false),
				},
			},
		]);
		const runner = BlockTesting.runner(block);

		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick(1, 0.2);
		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick(1, 0.4);
		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick(1, 0.3);
		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick(1, 0.2);
		BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: 727 });
	}
	export function delayBlockTickBased() {
		const [block] = BlockTesting.create([
			{
				id: "delayblock",
				config: {
					value: BlockTesting.num(727),
					duration: BlockTesting.num(3),
					tickBased: BlockTesting.bool(true),
				},
			},
		]);
		const runner = BlockTesting.runner(block);

		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick();
		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick();
		BlockAssert.resultError(block, runner, "result", BlockLogicValueResults.availableLater);
		runner.tick();
		BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: 727 });
	}

	export function delayBlockZeroImmediateNonTickBased() {
		const [block] = BlockTesting.create([
			{
				id: "delayblock",
				config: {
					value: BlockTesting.num(727),
					duration: BlockTesting.num(0),
					tickBased: BlockTesting.bool(false),
				},
			},
		]);
		const runner = BlockTesting.runner(block);

		BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: 727 });
	}
	export function delayBlockZeroImmediateTickBased() {
		const [block] = BlockTesting.create([
			{
				id: "delayblock",
				config: {
					value: BlockTesting.num(727),
					duration: BlockTesting.num(0),
					tickBased: BlockTesting.bool(true),
				},
			},
		]);
		const runner = BlockTesting.runner(block);

		BlockAssert.resultSuccessAndEquals(block, runner, "result", { value: 727 });
	}
}
export const _Tests: UnitTests = { BlockTests };
