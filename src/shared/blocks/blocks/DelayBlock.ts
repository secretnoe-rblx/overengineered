import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		value: {
			displayName: "Value",
			types: BlockConfigDefinitions.any,
			group: "0",
		},
		duration: {
			displayName: "Duration",
			types: BlockConfigDefinitions.number,
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: BlockConfigDefinitions.any,
			group: "0",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as DelayBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ value, valueType, valueChanged, duration }) => {
			if (!valueChanged) return;

			task.delay(duration, () => {
				if (this.isDestroyed()) return;
				this.output.result.set(valueType, value);
			});
		});
	}
}

export const DelayBlock = {
	...BlockCreation.defaults,
	id: "delayblock",
	displayName: "Delay Block",
	description: "Returns your value, but later",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "DELAY"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
