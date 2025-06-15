import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Physics } from "shared/Physics";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		result: {
			displayName: "Acceleration (stud/s²)",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as GravitySensorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.event.subscribe(RunService.Heartbeat, () => {
			this.output.result.set(
				"number",
				Physics.GetGravityOnHeight(Physics.LocalHeight.fromGlobal(this.instance.GetPivot().Y)),
			);
		});
	}
}

export const GravitySensorBlock = {
	...BlockCreation.defaults,
	id: "gravitysensor",
	displayName: "Gravity Sensor",
	description: "Returns the current gravity acceleration in stud/s²",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
