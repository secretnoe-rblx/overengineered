import { BlockLogicOperation } from "shared/blockLogic/BlockLogic3";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicResults, BlockLogicValues, BlockTickState } from "shared/blockLogic/BlockLogic3";
import type { BlockBuilder } from "shared/blocks/Block";

const config = {
	input: {
		value: BlockConfigDefinitions.any("Value", "0"),
	},
	output: {
		result: BlockConfigDefinitions.any("Result", "0"),
	},
} satisfies BlockConfigBothDefinitions;

export type { ConstantBlockLogic };
class ConstantBlockLogic extends BlockLogicOperation<typeof config> {
	constructor(block: PlacedBlockData) {
		super(config, block);
	}

	protected override calculate(
		ctx: BlockTickState,
		{ value }: BlockLogicValues<typeof config, "input">,
	): BlockLogicResults<typeof config> {
		return {
			result: value.pull(ctx),
		};
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
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
