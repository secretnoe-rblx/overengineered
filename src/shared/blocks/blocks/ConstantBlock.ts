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

const definition = {
	input: {
		value: {
			displayName: "Value",
			group: "0",
			types: BlockConfigDefinitions.any,
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Result",
			group: "0",
			types: BlockConfigDefinitions.any,
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { ConstantBlockLogic };
class ConstantBlockLogic extends CalculatableBlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);
	}

	protected override calculate(
		inputs: AllInputKeysToObject<typeof definition.input>,
	): AllOutputKeysToObject<typeof definition.output> {
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

	logic: { definition, ctor: ConstantBlockLogic },

	modelSource: {
		model: BlockCreation.Model.fAutoCreated("ConstLogicBlockPrefab", "CONST"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
