import { Assert } from "shared/Assert";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import { Logger } from "shared/Logger";
import type { DelayBlockLogic } from "shared/blocks/blocks/DelayBlock";
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
	export function testCircularConnectionTickOrder() {
		try {
			Logger.beginScope("part1");
			const [ticker, notb, mem, delay] = init();

			// waiting to return true from NOT
			BlockAssert.resultError(delay, ticker, "result", BlockLogicValueResults.availableLater, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: false }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: true }, "NOT");

			ticker.moveContextForward();

			BlockAssert.resultSuccessAndEquals(delay, ticker, "result", { value: true }, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);
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

			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: true }, "NOT");
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: false }, "MEMORY");
			// waiting to return true from NOT
			BlockAssert.resultError(delay, ticker, "result", BlockLogicValueResults.availableLater, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);

			ticker.moveContextForward();

			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: false }, "NOT");
			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: true }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(delay, ticker, "result", { value: true }, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);
		} catch (err) {
			$err(err);
		} finally {
			Logger.endScope();
		}

		try {
			Logger.beginScope("part3");
			const [ticker, notb, mem, delay] = init();

			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: false }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: true }, "NOT");
			// waiting to return true from NOT
			BlockAssert.resultError(delay, ticker, "result", BlockLogicValueResults.availableLater, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);

			ticker.moveContextForward();

			BlockAssert.resultSuccessAndEquals(mem, ticker, "result", { value: true }, "MEMORY");
			BlockAssert.resultSuccessAndEquals(notb, ticker, "result", { value: false }, "NOT");
			BlockAssert.resultSuccessAndEquals(delay, ticker, "result", { value: true }, "DELAY");
			Assert.equals((delay as DelayBlockLogic).getWaits().size(), 1);
		} catch (err) {
			$err(err);
		} finally {
			Logger.endScope();
		}
	}
}
export const _Tests: UnitTests = { BlockTests };
