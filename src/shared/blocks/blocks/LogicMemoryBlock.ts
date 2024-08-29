import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Objects } from "shared/fixes/objects";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		set: {
			displayName: "Set",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		value: {
			displayName: "Value",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: Objects.keys(BlockConfigDefinitions.any),
			group: "1",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as LogicMemoryBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		this.on(({ value, valueType, set }) => {
			if (!set) return;
			this.output.result.set(valueType, value);
		});
	}
}

export const LogicMemoryBlock = {
	...BlockCreation.defaults,
	id: "logicmemory",
	displayName: "Memory Cell",
	description: "Stores the value you gave it",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
