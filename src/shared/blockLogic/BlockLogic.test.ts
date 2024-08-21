import { Add } from "shared/blockLogic/BlockLogic";
import { LogicValueStorages, BlockBackedInputLogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";
import { ConstantBlock } from "shared/blocks/blocks/ConstantBlock";
import type { BlockLogic, BlockLogicBothDefinitions } from "shared/blockLogic/BlockLogic";

export namespace BlockLogicTests {
	export function test2() {
		const blocks: readonly BlockLogic<BlockLogicBothDefinitions>[] = [
			new Add({}),
			new Add({}),
			new ConstantBlock.logic.ctor({}),
			//
		];

		//

		blocks[2].replaceInput("value", new LogicValueStorages.number(4));

		blocks[0].replaceInput("value1", new BlockBackedInputLogicValueStorage(blocks[2], "result"));
		blocks[0].replaceInput("value2", new LogicValueStorages.number(3));

		blocks[1].replaceInput("value1", new BlockBackedInputLogicValueStorage(blocks[0], "result"));
		blocks[1].replaceInput("value2", new BlockBackedInputLogicValueStorage(blocks[0], "result"));

		print("asd2");

		//print(blocks[0].getOutputValue({ tick: 1 }, "result").value);
		print(blocks[0].getOutputValue({ tick: 1 }, "result").value);
		print(blocks[1].getOutputValue({ tick: 2 }, "result").value);
		print(blocks[2].getOutputValue({ tick: 3 }, "result").value);
	}
}
export namespace _Tests {
	export const BlockLogicT = BlockLogicTests;
}
