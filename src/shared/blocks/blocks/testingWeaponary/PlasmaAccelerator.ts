import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PlasmaCoilAcceleratorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
	}
}

export const PlasmaCoilAcceleratorBlock = {
	...BlockCreation.defaults,
	id: "plasmacoilaccelerator",
	displayName: "Plasma Accelerator",
	description: "",

	weaponConfig: {
		type: "PROCESSOR",
		modifier: {
			speedModifier: {
				value: 1.4,
				isRelative: true,
			},
		},
		markers: {
			marker1: {
				emitsProjectiles: true,
				allowedBlockIds: ["plasmacoilaccelerator"],
				//allowedTypes: ["PROCESSOR", "UPGRADE"],
			},
			marker2: {
				emitsProjectiles: false,
				allowedBlockIds: ["plasmaupgrade"],
				//allowedTypes: ["PROCESSOR", "UPGRADE"],
			},
		},
	},
} as const satisfies BlockBuilder;
