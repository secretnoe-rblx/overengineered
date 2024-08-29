import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RobloxUnit } from "shared/RobloxUnit";
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

		this.onTick(() => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			const linearVelocity = this.instance.PrimaryPart.AssemblyLinearVelocity;
			this.output.linear.set(
				"vector3",
				this.instance
					.GetPivot()
					.Rotation.ToObjectSpace(
						new CFrame(
							new Vector3(
								RobloxUnit.Studs_To_Meters(linearVelocity.X),
								RobloxUnit.Studs_To_Meters(linearVelocity.Y),
								RobloxUnit.Studs_To_Meters(linearVelocity.Z),
							),
						),
					).Position,
			);

			const angularVelocity = this.instance.PrimaryPart.AssemblyAngularVelocity;
			this.output.angular.set(
				"vector3",
				new Vector3(
					RobloxUnit.Studs_To_Meters(angularVelocity.X),
					RobloxUnit.Studs_To_Meters(angularVelocity.Y),
					RobloxUnit.Studs_To_Meters(angularVelocity.Z),
				),
			);
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
