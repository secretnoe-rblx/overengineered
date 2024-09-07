import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Physics } from "shared/Physics";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		result: {
			displayName: "Acceleration (m/s²)",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as GravitySensorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onRecalcInputs(() => {
			this.output.result.set(
				"number",
				RobloxUnit.Studs_To_Meters(
					Physics.GetGravityOnHeight(Physics.LocalHeight.fromGlobal(this.instance.GetPivot().Y)),
				),
			);
		});
	}
}

export const GravitySensorBlock = {
	...BlockCreation.defaults,
	id: "gravitysensor",
	displayName: "Gravity Sensor",
	description: "Returns the current gravity acceleration in m/s²",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
