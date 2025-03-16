import { Objects } from "engine/shared/fixes/Objects";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["value", "fallback"],
	input: {
		value: {
			displayName: "Value",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
		fallback: {
			displayName: "Fallback value",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
		startingValue: {
			displayName: "Start with value",
			types: BlockConfigDefinitions.any,
			group: "1",
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: Objects.keys(BlockConfigDefinitions.any),
			group: "1",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as FallbackBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		let valueSet = false;
		let cfallbackValue: string | number | boolean | Vector3 | Color3 | undefined;
		let cfallbackType: "string" | "number" | "bool" | "vector3" | "color" | "byte" | undefined;

		this.onk(["startingValue"], ({ startingValue }) => {
			this.output.result.set("bool", false);
		});

		this.onkRecalcInputs(
			["value"],
			({ value, valueType }) => {
				valueSet = true;
				this.output.result.set(valueType, value);
			},
			() => {
				valueSet = false;
				if (cfallbackType !== undefined && cfallbackValue !== undefined) {
					this.output.result.set(cfallbackType, cfallbackValue);
				}
			},
		);

		this.onkRecalcInputs(["fallback"], ({ fallback, fallbackType }) => {
			if (valueSet) return;

			[cfallbackValue, cfallbackType] = [fallback, fallbackType];
			this.output.result.set(fallbackType, fallback);
		});
	}
}

export const FallbackBlock = {
	...BlockCreation.defaults,
	id: "fallback",
	displayName: "Fallback",
	description: "Returns the fallback value if the input is AVAILABLELATER",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "FALLBACK"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
