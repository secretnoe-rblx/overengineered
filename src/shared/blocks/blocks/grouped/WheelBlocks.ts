import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilderWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	input: {
		friction: {
			displayName: "Tire friction",
			types: {
				number: {
					type: "clampedNumber",
					config: 50,
					max: 100,
					min: 0.1,
					step: 0.1,
				},
			},
		},
		elasticity: {
			displayName: "Tire elasticity",
			types: {
				number: {
					type: "clampedNumber",
					config: 50,
					max: 100,
					min: 0.1,
					step: 0.1,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { WheelBlockLogic };
class WheelBlockLogic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ friction, elasticity }) => {
			const collider = this.instance.FindFirstChild("Collider") as BasePart | undefined;
			if (!collider) return;

			const props = collider.CustomPhysicalProperties;
			if (!props) return;

			const frictionMagic = 2; // hardcoded
			const elasticityMagic = 1; // hardcoded

			const frictionModifier = friction / 100;
			const elasticityModifier = elasticity / 100;

			collider.CustomPhysicalProperties = new PhysicalProperties(
				props.Density,
				frictionModifier * frictionMagic,
				elasticityModifier * elasticityMagic,
				props.FrictionWeight,
				props.ElasticityWeight,
			);
		});
	}
}

const logic: BlockLogicInfo = { definition, ctor: WheelBlockLogic };
const list = {
	wheel: {
		displayName: "Wheel",
		description: "circle",
		logic,
	},
	bigwheel: {
		displayName: "Big wheel",
		description: "Wheel. Big one.",
		logic,
	},
	smalloldwheel: {
		displayName: "Small old wheel",
		description: "smol ol whel",
		logic,
	},
	oldwheel: {
		displayName: "Old wheel",
		description: "A ginormous old wheel",
		logic,
	},
	bigoldwheel: {
		displayName: "Big old wheel",
		description: "Old wheel. Big one.",
		logic,
	},
} satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };
export const WheelBlocks = BlockCreation.arrayFromObject(list);

export type WheelBlockIds = keyof typeof list;
