import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as AnchorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const attachment = new Instance("Attachment", block.instance.PrimaryPart);

		const linearVelocity = new Instance("LinearVelocity");
		linearVelocity.ForceLimitsEnabled = false;
		linearVelocity.Attachment0 = attachment;
		linearVelocity.VectorVelocity = Vector3.zero;
		linearVelocity.Parent = block.instance.PrimaryPart;

		const angularVelocity = new Instance("AngularVelocity");
		angularVelocity.Attachment0 = attachment;
		angularVelocity.AngularVelocity = Vector3.zero;
		angularVelocity.Parent = block.instance.PrimaryPart;
	}
}

export const AnchorBlock = {
	...BlockCreation.defaults,
	id: "anchorblock",
	displayName: "Anchor",
	description: "An immovable block",
	limit: 20,

	weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
