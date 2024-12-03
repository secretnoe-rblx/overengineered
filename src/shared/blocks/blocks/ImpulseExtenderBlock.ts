import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder, BlockModelSource } from "shared/blocks/Block";

const definition = {
	input: {
		input: {
			displayName: "Input",
			tooltip: "Wire source impulse here",
			types: {
				bool: {
					config: false,
				},
			},
		},
		length: {
			displayName: "New impulse length",
			tooltip: "Length of the new impulse",
			types: {
				number: {
					config: 2,
				},
			},
		},
	},
	output: {
		result: {
			displayName: "Extended impulse",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as ImpulseExtenderBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let lenLeft = 0;
		const len = this.initializeInputCache("length");
		const state = this.initializeInputCache("input");

		this.onTicc(() => {
			if (state.tryGet()) lenLeft = math.max(1, len.tryGet() ?? 0);
			this.output.result.set("bool", --lenLeft > 0);
		});
	}
}

export const ImpulseExtenderBlock = {
	...BlockCreation.defaults,
	id: "impulseextender",
	displayName: "Impulse Extender",
	description: "Extends pulse to specified amount of ticks.",

	modelSource: {
		model: BlockCreation.Model.fAutoCreated("GenericLogicBlockPrefab", "ImpExt"),
		category: () => BlockCreation.Categories.other,
	} satisfies BlockModelSource,
	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
