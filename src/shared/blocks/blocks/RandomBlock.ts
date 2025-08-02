import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["min", "max"],
	input: {
		min: {
			displayName: "Min",
			types: {
				number: { config: 0 },
				vector3: { config: Vector3.zero },
			},
			group: "0",
		},
		max: {
			displayName: "Max",
			types: {
				number: { config: 1 },
				vector3: { config: Vector3.one },
			},
			group: "0",
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: ["number", "vector3"],
			group: "0",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as RandomBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onAlwaysInputs(({ min, max }) => {
			if (typeIs(min, "number") && typeIs(max, "number")) {
				if (max <= min) {
					this.disableAndBurn();
					return BlockLogicValueResults.garbage;
				}

				this.output.result.set("number", math.random() * (max - min) + min);
			} else if (typeIs(min, "Vector3") && typeIs(max, "Vector3")) {
				if (max.X <= min.X || max.Y <= min.Y || max.Z <= min.Z) {
					this.disableAndBurn();
					return BlockLogicValueResults.garbage;
				}

				this.output.result.set(
					"vector3",
					new Vector3(
						math.random() * (max.X - min.X) + min.X,
						math.random() * (max.Y - min.Y) + min.Y,
						math.random() * (max.Z - min.Z) + min.Z,
					),
				);
			}
		});
	}
}

export const RandomBlock = {
	...BlockCreation.defaults,
	id: "rand",
	displayName: "Random",
	description: `Returns a "random" number between min and max (excluding maximum)`,
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "RAND"),
		category: () => BlockCreation.Categories.math,
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
