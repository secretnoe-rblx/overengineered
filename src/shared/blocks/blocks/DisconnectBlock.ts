import { InstanceBlockLogic as InstanceBlockLogic4 } from "shared/blockLogic/BlockLogic4";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic4";
import type { BlockBuilder } from "shared/blocks/Block";

const config = {
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

export type { DisconnectBlockLogic };
class DisconnectBlockLogic extends InstanceBlockLogic4<typeof config> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("b_disconnectblock_disconnect"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(config, block);

		this.on((ctx, { disconnect }) => {
			if (disconnect) {
				DisconnectBlockLogic.events.disconnect.send({ block: this.instance });
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

	logic: { config, ctor: DisconnectBlockLogic },
} as const satisfies BlockBuilder;
