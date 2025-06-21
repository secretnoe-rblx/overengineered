import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		linear: {
			displayName: "Linear Velocity",
			types: ["vector3"],
		},
		angular: {
			displayName: "Angular Velocity",
			types: ["vector3"],
		},
		linearAcceleration: {
			displayName: "Linear Acceleration",
			types: ["vector3"],
		},
		angularAcceleration: {
			displayName: "Angular Acceleration",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as SpeedometerBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const getLocalPos = (pos: Vector3) => this.instance.GetPivot().Rotation.ToObjectSpace(new CFrame(pos)).Position;

		const localVelocity = {
			linear: Vector3.zero,
			angular: Vector3.zero,
		};

		const f = () => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			const l1 = getLocalPos(this.instance.PrimaryPart.AssemblyLinearVelocity);
			const l2 = getLocalPos(this.instance.PrimaryPart.AssemblyAngularVelocity);

			this.output.linearAcceleration.set("vector3", l1.sub(localVelocity.linear));
			this.output.angularAcceleration.set("vector3", l2.sub(localVelocity.angular));

			this.output.linear.set("vector3", (localVelocity.linear = l1));
			this.output.angular.set("vector3", (localVelocity.angular = l2));
		};

		this.onRecalcInputs(f);
	}
}

export const SpeedometerBlock = {
	...BlockCreation.defaults,
	id: "speedometer",
	displayName: "Speedometer",
	description:
		"Returns the current velocity and acceleration. Yes I know, there should've been a separate accelerometer block. It was.",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
