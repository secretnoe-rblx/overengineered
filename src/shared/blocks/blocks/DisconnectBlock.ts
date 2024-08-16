import { BlockLogicActor } from "shared/blockLogic/BlockLogic3";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const config = {
	input: {
		disconnect: {
			displayName: "Disconnect",
			types: {
				keybool: {
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
} satisfies BlockConfigBothDefinitions;

export type { DisconnectBlockLogic };
class DisconnectBlockLogic extends BlockLogicActor<typeof config> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("b_disconnectblock_disconnect"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(config, block);

		this.on(["disconnect"], ([disconnect]) => {
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
