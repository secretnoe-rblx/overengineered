import { Assert } from "engine/shared/Assert";
import { Logger } from "engine/shared/Logger";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import type { UnitTests } from "engine/shared/TestFramework";
import type { DelayBlockLogic } from "shared/blocks/blocks/DelayBlock";

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

	export function testCaching() {
		/* the situation of (KEY->AND->NOT->AND...)
		если NOT запускается раньше AND то 
		1. not берет у and значение
			1.1. чтобы взять значение, and должен пересчитаться.
			1.2. оба инпута у and сейчас возвращают true, and устанавливает свой результат на true
		2. not получает true и выдаёт false
		and в этом тике уже обновился и не понял что один инпут изменился на false 
		*/

		{
			const blocks = BlockTesting.create([
				{ id: "not", config: { value: BlockTesting.wire(1, "result") } },
				{
					id: "and",
					config: { value1: BlockTesting.wire(2, "result"), value2: BlockTesting.wire(0, "result") },
				},
				{ id: "constant", config: { value: BlockTesting.bool(false) } },
			]);

			const ticker = BlockTesting.runner(...blocks);
			const [_not, _and, _constant] = blocks;

			BlockAssert.resultSuccessAndEquals(_not, ticker, "result", { value: true }, "NOT1");
			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: false }, "AND1");

			_constant.setOutputValue("result", "bool", true);
			ticker.tick();
			BlockAssert.resultSuccessAndEquals(_not, ticker, "result", { value: false }, "NOT2");
			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: true }, "AND2");

			ticker.tick();
			BlockAssert.resultSuccessAndEquals(_not, ticker, "result", { value: true }, "NOT3");
			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: false }, "AND3");
		}

		//

		{
			const blocks = BlockTesting.create([
				{ id: "not", config: { value: BlockTesting.wire(1, "result") } },
				{
					id: "and",
					config: { value1: BlockTesting.wire(2, "result"), value2: BlockTesting.wire(0, "result") },
				},
				{ id: "constant", config: { value: BlockTesting.bool(false) } },
			]);

			const ticker = BlockTesting.runner(...blocks);
			const [_not, _and, _constant] = blocks;

			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: false }, "AND11");
			BlockAssert.resultError(_not, ticker, "result", BlockLogicValueResults.availableLater, "NOT11");

			_constant.setOutputValue("result", "bool", true);
			ticker.tick();
			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: false }, "AND12");
			BlockAssert.resultSuccessAndEquals(_not, ticker, "result", { value: true }, "NOT12");

			ticker.tick();
			BlockAssert.resultSuccessAndEquals(_and, ticker, "result", { value: false }, "AND13");
			BlockAssert.resultSuccessAndEquals(_not, ticker, "result", { value: true }, "NOT13");
		}
	}
}
export const _Tests: UnitTests = { BlockTests };
