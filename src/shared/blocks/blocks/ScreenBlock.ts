import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		data: {
			displayName: "Data",
			types: BlockConfigDefinitions.any,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type ScreenBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

export type { ScreenBlockLogic };
class ScreenBlockLogic extends InstanceBlockLogic<typeof definition, ScreenBlock> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: ScreenBlock;
			readonly text: string;
			readonly translate: boolean;
		}>("b_screen_update"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ data }) => {
			ScreenBlockLogic.events.update.send({
				block: this.instance,
				text: tostring(data),
				translate: typeIs(data, "string"),
			});
		});
	}
}

export const ScreenBlock = {
	...BlockCreation.defaults,
	id: "screen",
	displayName: "Screen",
	description: "Display all your data for everyone to see!",

	logic: { definition, ctor: ScreenBlockLogic },
} as const satisfies BlockBuilder;
