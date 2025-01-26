import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PlasmaCoilAcceleratorUpgradeBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
	}
}

export const PlasmaCoilAcceleratorUpgradeBlock = {
	...BlockCreation.defaults,
	id: "plasmaupgrade",
	displayName: "Plasma Upgrade",
	description: "",

	weaponConfig: {
		type: "UPGRADE",
		modifier: {
			speedModifier: {
				value: 1.05,
				isRelative: true,
			},
		},
		markers: {},
	},
} as const satisfies BlockBuilder;
