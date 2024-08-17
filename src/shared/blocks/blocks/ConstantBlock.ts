import { CalculatableBlockLogic } from "shared/blockLogic/BlockLogic4";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type {
	AllInputKeysToObject,
	AllOutputKeysToObject,
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
} from "shared/blockLogic/BlockLogic4";
import type { BlockBuilder } from "shared/blocks/Block";

const config = {
	input: {
		value: BlockConfigDefinitions.any("Value", "0"),
	},
	output: {
		result: BlockConfigDefinitions.any("Result", "0"),
	},
} satisfies BlockLogicFullBothDefinitions;

export type { ConstantBlockLogic };
class ConstantBlockLogic extends CalculatableBlockLogic<typeof config> {
	constructor(block: BlockLogicArgs) {
		super(config, block);
	}

	protected override calculate(
		inputs: AllInputKeysToObject<typeof config.input>,
	): AllOutputKeysToObject<typeof config.output> {
		return {
			result: {
				type: inputs.valueType,
				value: inputs.value,
			},
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
