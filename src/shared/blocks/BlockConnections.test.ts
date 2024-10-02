import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockAssert } from "shared/blocks/testing/BlockAssert";
import { BlockTesting } from "shared/blocks/testing/BlockTesting";
import type { UnitTests } from "engine/shared/TestFramework";

namespace BlockTests {
	function init() {
		const blocks = BlockTesting.create([
			{ id: "not", config: { value: BlockTesting.wire(1, "result") } },
			{
				id: "delayblock",
				config: {
					duration: BlockTesting.num(1),
					tickBased: BlockTesting.bool(false),
					value: BlockTesting.wire(0, "result"),
				},
			},
			{ id: "screen", config: { data: BlockTesting.wire(1, "result") } },
		]);

		const ticker = BlockTesting.runner(...blocks);
		const [notb, delay, screen] = blocks;

		return $tuple(ticker, notb, delay, screen);
	}

	export function testCircularConnectionsReturningAvailableLater() {
		const test = (...blockIndexes: readonly number[]) => {
			try {
				$log("Testing", ...blockIndexes);
				const [ticker, notb, delay, screen] = init();

				const names = ["not", "delay", "screen"];
				const blocks = [notb, delay, screen];

				for (const i of blockIndexes) {
					const block = blocks[i];
					const id = names[i];

					if (id === "screen") {
						block.ticc(ticker.getContext());
						return;
					}

					BlockAssert.resultError(
						block,
						ticker,
						"result",
						BlockLogicValueResults.availableLater,
						`Block ${id} should return availableLater`,
					);
				}
			} catch (err) {
				$err(err);
			}
		};

		test(2, 0, 1);
		test(2, 1, 0);
		test(0, 2, 1);
		test(0, 1, 2);
		test(1, 0, 2);
		test(1, 2, 0);
	}
}
export const _Tests: UnitTests = { BlockTests };
