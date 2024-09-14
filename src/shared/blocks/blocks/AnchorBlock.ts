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

		const alignPosition = new Instance("AlignPosition");
		alignPosition.Mode = Enum.PositionAlignmentMode.OneAttachment;
		alignPosition.MaxForce = math.huge;
		alignPosition.MaxVelocity = math.huge;
		alignPosition.Attachment0 = attachment;
		alignPosition.Position = block.instance.GetPivot().Position;
		alignPosition.Responsiveness = 200;
		alignPosition.Parent = block.instance.PrimaryPart;

		const angularVelocity = new Instance("AlignOrientation");
		angularVelocity.Mode = Enum.OrientationAlignmentMode.OneAttachment;
		angularVelocity.MaxAngularVelocity = math.huge;
		angularVelocity.MaxTorque = math.huge;
		angularVelocity.Responsiveness = 200;
		angularVelocity.Attachment0 = attachment;
		angularVelocity.CFrame = block.instance.GetPivot().Rotation;
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
