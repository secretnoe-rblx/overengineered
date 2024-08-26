import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		key: {
			displayName: "Key",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							key: "F",
							switch: false,
							reversed: false,
						},
						canBeSwitch: true,
						canBeReversed: true,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Pressed",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as KeySensorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);
		this.on(({ key }) => this.output.result.set("bool", key));
	}
}

export const KeySensorBlock = {
	...BlockCreation.defaults,
	id: "keysensor",
	displayName: "Keyboard Sensor",
	description: "Returns true when the chosen button is pressed",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
