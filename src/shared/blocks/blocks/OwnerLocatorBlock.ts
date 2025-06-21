import { Players, RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	outputOrder: ["linear", "angular"],
	input: {},
	output: {
		linear: {
			displayName: "Offset",
			unit: "Studs, relative",
			types: ["vector3"],
		},
		angular: {
			displayName: "Angular offset",
			unit: "Radians, relative",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as OwnerLocatorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.event.subscribe(RunService.PostSimulation, () => {
			if (!this.instance.PrimaryPart) return;

			const owner = Players.LocalPlayer;
			const playerPart = owner.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
			if (!playerPart) return;

			const localPosition = this.instance
				.GetPivot()
				.mul(CFrame.Angles(-math.pi / 2, 0, math.pi / 2))
				.PointToObjectSpace(playerPart.Position);

			const xa = Vector3.yAxis.Angle(localPosition.mul(new Vector3(0, 1, 1)), Vector3.xAxis);
			const ya = Vector3.zAxis.Angle(localPosition.mul(new Vector3(1, 0, 1)), Vector3.yAxis);
			const za = Vector3.xAxis.Angle(localPosition.mul(new Vector3(1, 1, 0)), Vector3.zAxis);

			this.output.angular.set("vector3", new Vector3(math.deg(xa), math.deg(ya), math.deg(za)));

			this.output.linear.set("vector3", localPosition);
		});
	}
}

export const OwnerLocatorBlock = {
	...BlockCreation.defaults,
	id: "ownerlocator",
	displayName: "Owner Locator",
	description: "IT WILL FIND YOU",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
