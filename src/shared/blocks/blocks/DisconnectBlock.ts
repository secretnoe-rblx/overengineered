import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		disconnect: {
			displayName: "Disconnect",
			types: {
				bool: {
					type: "keybool",
					config: {
						key: "F",
						reversed: false,
						switch: false,
					},
					canBeReversed: true,
					canBeSwitch: true,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as DisconnectBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("b_disconnectblock_disconnect"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ disconnect }) => {
			if (disconnect) {
				Logic.events.disconnect.send({ block: this.instance });
				this.disable();
			}
		});
	}
}

export const DisconnectBlock = {
	...BlockCreation.defaults,
	id: "disconnectblock",
	displayName: "Disconnector",
	description: "Detaches connected parts",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
