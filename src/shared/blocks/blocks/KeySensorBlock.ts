import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		key: {
			displayName: "Key",
			types: {
				bool: {
					type: "keybool",
					canBeSwitch: true,
					canBeReversed: true,
					config: {
						key: "F" as KeyCode,
						switch: false as boolean,
						reversed: false,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Pressed",
			types: BlockConfigDefinitions.bool,
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as KeySensorBlockLogic };

@injectable
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
