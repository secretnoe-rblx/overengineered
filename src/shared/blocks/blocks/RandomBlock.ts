import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["min", "max"],
	input: {
		min: { displayName: "Min", types: BlockConfigDefinitions.number },
		max: { displayName: "Max", types: BlockConfigDefinitions.number },
	},
	output: {
		result: {
			displayName: "Result",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as RandomBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onAlwaysInputs(({ min, max }) => {
			if (max <= min) {
				this.disableAndBurn();
				return BlockLogicValueResults.garbage;
			}

			this.output.result.set("number", math.random() * (max - min) + min);
		});
	}
}

export const RandomBlock = {
	...BlockCreation.defaults,
	id: "rand",
	displayName: "Random",
	description: `Returns a "random" value between chosen minimum and maximum (excluding maximum)`,
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "RAND"),
		category: () => BlockCreation.Categories.math,
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
