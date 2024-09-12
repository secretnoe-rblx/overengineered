import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		angle: {
			displayName: "Braces Angle",
			types: {
				number: {
					config: 0 as number,
					clamp: {
						showAsSlider: true,
						min: -180,
						max: 180,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as BracedShaftBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		init: new AutoC2SRemoteEvent<{ readonly block: BlockModel; readonly angle: number }>("bracedshard_init"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ angle }) => {
			Logic.init(block.instance, angle);
			Logic.events.init.send({ block: block.instance, angle });
		});
	}

	static init(block: BlockModel, angle: number) {
		for (let i = 1; i <= 4; i++) {
			const rot = block.WaitForChild(`rot${i}`) as BasePart;
			const weld = rot.WaitForChild("WeldConstraint") as WeldConstraint;
			weld.Enabled = false;

			rot.CFrame = rot.CFrame.mul(CFrame.Angles(math.rad(angle), 0, 0));
			weld.Enabled = true;
		}
	}
}

export const BracedShaftBlock = {
	...BlockCreation.defaults,
	id: "bracedshaft",
	displayName: "Braced Shaft",
	description: "A shaft with adjustable braces",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
