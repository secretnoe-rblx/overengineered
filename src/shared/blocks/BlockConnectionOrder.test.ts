import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import { Logger } from "shared/Logger";
import type { UnitTests } from "shared/test/TestFramework";

namespace BlockTests {
	function init() {
		const blocks = BlockTesting.create([
			{ id: "not", config: { value: BlockTesting.wire(1, "result") } },
			{
				id: "logicmemory",
				config: {
					defaultValue: BlockTesting.bool(false),
					set: BlockTesting.bool(true),
					value: BlockTesting.wire(2, "result"),
				},
			},
			{
				id: "delayblock",
				config: {
					duration: BlockTesting.num(1),
					tickBased: BlockTesting.bool(true),
					value: BlockTesting.wire(0, "result"),
				},
			},
		]);

		const ticker = BlockTesting.runner(...blocks);

		// delay -> memory -> not -> delay ...
		const [notb, mem, delay] = blocks;

		return $tuple(ticker, notb, mem, delay);
	}

	// The order of these is different but the results should be the same
	export function testConnectionOrder() {
		try {
			Logger.beginScope("part1");
			const [ticker, notb, mem, delay] = init();

			$log(1);
			// waiting to return true from NOT
			BlockAssert.resultError(delay, ticker, "result", BlockLogicValueResults.availableLater, "DELAY");
			$log(2);
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: false }, "MEMORY");
			$log(3);
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: true }, "NOT");

			$log("tick");
			ticker.tick();

			BlockAssert.resultSuccessAndEquals(delay, ticker, "result", { value: true }, "DELAY");
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: true }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: false }, "NOT");
		} catch (err) {
			$err(err);
		} finally {
			Logger.endScope();
		}

		try {
			Logger.beginScope("part2");
			const [ticker, notb, mem, delay] = init();

			$log(1);
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: true }, "NOT");
			$log(2);
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: false }, "MEMORY");
			$log(3);
			Logger.enabledLevels.enable(Logger.levels.trace);
			// waiting to return true from NOT
			BlockAssert.resultError(delay, ticker, "result", BlockLogicValueResults.availableLater, "DELAY");
			Logger.enabledLevels.disable(Logger.levels.trace);

			$log("tick");
			ticker.tick();

			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: false }, "NOT");
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: true }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(delay, ticker, "result", { value: true }, "DELAY");
		} catch (err) {
			$err(err);
		} finally {
			Logger.endScope();
		}
	}
}
export const _Tests: UnitTests = { BlockTests };
