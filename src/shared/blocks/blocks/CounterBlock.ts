import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["newvalue", "step", "triggerStep", "triggerValue"],
	input: {
		newvalue: {
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

		this.onkFirstInputs(["newvalue"], ({ newvalue }) => set(newvalue));
		this.onk(
			["triggerValue", "newvalue"],
			({ triggerValue: rewrite, triggerValueChanged: rewriteChanged, newvalue }) => {
				if (!rewrite || !rewriteChanged) return;
				set(newvalue);
			},
		);
		this.onk(["step", "triggerStep"], ({ triggerStep, triggerStepChanged, step }) => {
			if (!triggerStep || !triggerStepChanged) return;
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
