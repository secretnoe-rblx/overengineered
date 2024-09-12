import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["value", "step", "triggerStep", "triggerValue"],
	input: {
		value: {
			displayName: "New value",
			types: {
				number: {
					config: 0,
				},
			},
		},
		step: {
			displayName: "Step value",
			types: {
				number: {
					config: 1,
				},
			},
		},
		triggerStep: {
			displayName: "Step",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		triggerValue: {
			//a.k.a. rewrite value
			displayName: "Rewrite",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
	},
	output: {
		value: {
			displayName: "Output",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as CounterBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const get = () => this.output.value.justGet().value;
		const set = (value: number) => this.output.value.set("number", value);

		this.onkFirstInputs(["value"], ({ value }) => set(value));
		this.on(({ triggerStep, triggerStepChanged, triggerValue, step, value }) => {
			if (!triggerStep || !triggerStepChanged) return;

			if (triggerValue) {
				set(value);
				return;
			}

			set(get() + step);
		});
	}
}

export const CounterBlock = {
	...BlockCreation.defaults,
	id: "counter",
	displayName: "Counter",
	description: "Returns a previous value plus step value.",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "COUNTER"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
