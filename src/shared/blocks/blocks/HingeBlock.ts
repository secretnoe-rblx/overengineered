import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type HingeBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};

export type { Logic as MotorBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, HingeBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		this.onTicc(() => {
			const base = this.instance.FindFirstChild("Base") as BasePart | undefined;
			const attach = this.instance.FindFirstChild("Attach") as BasePart | undefined;
			if (!attach || !base) {
				this.disableAndBurn();
				return;
			}

			if (attach.Position.sub(base.Position).Magnitude > 3 * blockScale.Y) {
				RemoteEvents.ImpactBreak.send([base]);
				this.disable();
			}
		});
	}
}

export const HingeBlock = {
	...BlockCreation.defaults,
	id: "hingeblock",
	displayName: "Hinge",
	description: "A simple hinge. Allows things to rotate in one plane",
	limit: 50,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
