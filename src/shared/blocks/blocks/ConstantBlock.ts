import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/BlockCreation";

const config = {
	input: {
		value: BlockConfigDefinitions.any("Value", "number", "0"),
	},
	output: {
		result: BlockConfigDefinitions.any("Result", "number", "0"),
	},
} satisfies BlockConfigBothDefinitions;

export type { ConstantBlockLogic };
class ConstantBlockLogic extends BlockLogic<typeof config> {
	constructor(block: PlacedBlockData) {
		super(block, config);
		this.event.subscribeObservable(
			this.input.value,
			({ value, valueType }) => this.output.result.set(valueType, value),
			true,
		);
	}
}

export const ConstantBlock = {
	...BlockCreation.defaults,
	id: "constant",
	displayName: "Constant",
	description: "Returns the value you've set",

	logic: { config, ctor: ConstantBlockLogic },

	modelSource: {
		model: BlockCreation.Model.fAutoCreated("ConstLogicBlockPrefab", "CONST"),
		category: () => ["Logic", "Other"],
	},
} as const satisfies BlockBuilder;
