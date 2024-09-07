import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		result: {
			displayName: "Altitude",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as AltimeterBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onRecalcInputs(() => {
			const result = RobloxUnit.Studs_To_Meters(this.instance.GetPivot().Y - GameDefinitions.HEIGHT_OFFSET);
			this.output.result.set("number", result);
		});
	}
}

export const AltimeterBlock = {
	...BlockCreation.defaults,
	id: "altimeter",
	displayName: "Altimeter",
	description: "Returns current height",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
