import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	outputOrder: ["linear", "angular"],
	input: {},
	output: {
		linear: {
			displayName: "Linear",
			types: ["vector3"],
		},
		angular: {
			displayName: "Angular",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as SpeedometerBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onRecalcInputs(() => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			this.output.linear.set(
				"vector3",
				this.instance
					.GetPivot()
					.Rotation.ToObjectSpace(new CFrame(this.instance.PrimaryPart.AssemblyLinearVelocity)).Position,
			);

			this.output.angular.set("vector3", this.instance.PrimaryPart.AssemblyAngularVelocity);
		});
	}
}

export const SpeedometerBlock = {
	...BlockCreation.defaults,
	id: "speedometer",
	displayName: "Speedometer",
	description: "Returns the current velocity",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
