import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		result: {
			displayName: "Global Position",
			unit: "Coordinates",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as GPSSensorBlock };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const offset = new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0);

		this.onRecalcInputs(() => {
			this.output.result.set("vector3", offset.add(block.instance.GetPivot().Position));
		});
	}
}

export const AngleSensorBlock = {
	...BlockCreation.defaults,
	id: "gpssensor",
	displayName: "GPS",
	description: "Returns its global position",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
