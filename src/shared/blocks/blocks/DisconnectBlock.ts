import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		disconnect: {
			displayName: "Disconnect",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "F",
							reversed: false,
							switch: false,
						},
						canBeReversed: false,
						canBeSwitch: false,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as DisconnectBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		disconnect: new A2SRemoteEvent<{ readonly block: BlockModel }>("b_disconnectblock_disconnect"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ disconnect }) => {
			if (disconnect) {
				Logic.events.disconnect.send({ block: this.instance });
				Logic.disconnect(this.instance);
			}
		});
	}

	static disconnect(block: BlockModel) {
		(block.FindFirstChild("Ejector") as Part | undefined)?.Destroy();
	}
}

export const DisconnectBlock = {
	...BlockCreation.defaults,
	id: "disconnectblock",
	limit: 100,
	displayName: "Disconnector",
	description: "Detaches connected parts",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
