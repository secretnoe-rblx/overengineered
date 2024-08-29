import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		value: {
			displayName: "Value",
			types: {
				byte: {
					config: 0,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as SevenSegmentDisplayBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly code: number;
		}>("sevensegmentdisplay_update"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ value }) => {
			Logic.events.update.send({
				block: block.instance,
				code: value,
			});
		});
	}
}

export const SevenSegmentDisplayBlock = {
	...BlockCreation.defaults,
	id: "sevensegmentdisplay",
	displayName: "7-Segment Display",
	description: "Simple 7-Segment display. Opcode viewer? OwO",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
