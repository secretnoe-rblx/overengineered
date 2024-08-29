import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		density: {
			displayName: "Density",
			tooltip:
				"Amount of mass per unit volume. The more dense a part is, the more force it takes to accelerate it.",
			unit: "m/V",
			types: {
				number: {
					config: 0,
					control: {
						defaultType: "smooth",
						min: 0.15,
						max: 10,
						canBeSwitch: true,
						config: {
							type: "smooth",
							add: "R",
							sub: "F",
							speed: 0.2,
							startValue: 0,
							switchmode: false,
						},
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type BallastModel = BlockModel & {
	readonly Part: Part;
};

export type { Logic as BallastBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, BallastModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ density }) => {
			const currentPhysProp = this.instance.Part.CurrentPhysicalProperties;
			const materialPhysProp = new PhysicalProperties(this.instance.Part.Material);
			const physProp = new PhysicalProperties(
				materialPhysProp.Density + density,
				currentPhysProp.Friction,
				currentPhysProp.Elasticity,
				currentPhysProp.FrictionWeight,
				currentPhysProp.ElasticityWeight,
			);
			this.instance.Part.CustomPhysicalProperties = physProp;
		});
	}
}

export const BallastBlock = {
	...BlockCreation.defaults,
	id: "ballast",
	displayName: "Ballast",
	description: "(Un)managable weight of existence. Now in compact form!",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
