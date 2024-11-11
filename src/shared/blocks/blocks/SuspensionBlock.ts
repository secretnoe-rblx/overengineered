import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["damping", "stiffness", "free_length", "max_force"],
	input: {
		damping: {
			displayName: "Damping",
			types: {
				number: {
					config: 250,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 10_000,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
		stiffness: {
			displayName: "Stiffness",
			types: {
				number: {
					config: 75_000,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100_000,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
		free_length: {
			displayName: "Free Length",
			types: {
				number: {
					config: 4.5,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 10,
						step: 0.01,
					},
				},
			},
		},
		max_force: {
			displayName: "Force",
			types: {
				number: {
					config: 1000,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 800000,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type SuspensionModel = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly Spring: SpringConstraint;
		readonly Beam: Beam;
	};
};

export type { Logic as SuspensionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, SuspensionModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const blockScale = BlockManager.manager.scale.get(block.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		const spring = this.instance.FindFirstChild("SpringSide")?.FindFirstChild("Spring") as
			| SpringConstraint
			| undefined;
		if (spring) {
			spring.Radius *= blockScale.findMin();
		}

		this.on(({ max_force, damping, stiffness, free_length }) => {
			const spring = this.instance.FindFirstChild("SpringSide")?.FindFirstChild("Spring") as
				| SpringConstraint
				| undefined;
			if (!spring) return;

			spring.MaxForce = max_force * scale;
			spring.Damping = damping * scale;
			spring.Stiffness = stiffness * scale;
			spring.FreeLength = free_length * blockScale.Y;
		});
	}
}

export const SuspensionBlock = {
	...BlockCreation.defaults,
	id: "suspensionblock",
	displayName: "Suspension",
	description: "Sus pension spring",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
