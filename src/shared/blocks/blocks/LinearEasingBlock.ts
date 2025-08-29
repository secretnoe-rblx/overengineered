import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["startValue", "targetValue", "speed"],
	input: {
		startValue: {
			displayName: "Start value",
			types: {
				number: { config: 0 },
			},
			connectorHidden: true,
		},
		targetValue: {
			displayName: "Target value",
			types: { number: { config: 100 } },
		},
		speed: {
			displayName: "Speed",
			unit: "Change per second",
			types: {
				number: { config: 20 },
			},
		},
	},
	output: {
		value: {
			displayName: "Output",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as ControllerBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const set = (value: number) => this.output.value.set("number", value);
		this.onkFirstInputs(["startValue"], ({ startValue }) => set(startValue));

		this.onAlwaysInputs(({ targetValue, speed }, { dt }) => {
			const start = this.output.value.justGet().value;
			if (start === targetValue) return;

			const direction = targetValue < start ? -1 : 1;
			const diffdt = math.min(dt * speed, math.abs(targetValue - start)) * direction;

			this.output.value.set("number", start + diffdt);
		});
	}
}

export const LinearEasingBlock = {
	...BlockCreation.defaults,
	id: "lineareasing",
	displayName: "Linear Easing",
	description: "Smoothly changes the output value to the input target",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "LINEAR EASING"),
		category: () => BlockCreation.Categories.sensor,
	},
} as const satisfies BlockBuilder;
