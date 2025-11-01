import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["p", "i", "d", "target", "now"],
	input: {
		p: {
			displayName: "P",
			connectorHidden: true,
			types: {
				number: {
					config: 0,
				},
			},
		},
		i: {
			displayName: "I",
			connectorHidden: true,
			types: {
				number: {
					config: 0,
				},
			},
		},
		d: {
			displayName: "D",
			connectorHidden: true,
			types: {
				number: {
					config: 0,
				},
			},
		},
		target: {
			displayName: "Target value",
			types: {
				number: {
					config: 0,
				},
			},
		},
		now: {
			displayName: "Current value",
			types: {
				number: {
					config: 0,
				},
			},
		},
	},
	output: {
		output: {
			displayName: "Output",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PidControllerBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		let inputValues = {
			p: 0,
			i: 0,
			d: 0,
			target: 0,
			now: 0,
		};

		this.on((data) => (inputValues = data));

		let errorPrev = 0;
		let integral = 0;
		this.onTicc(({ dt }) => {
			const errorCost = inputValues.target - inputValues.now;
			integral = integral + errorCost * dt;
			const derivative = (errorCost - errorPrev) / dt;
			const output = inputValues.p * errorCost + inputValues.i * integral + inputValues.d * derivative;

			errorPrev = errorCost;

			this.output.output.set("number", output);
		});
	}
}

export const PidControllerBlock = {
	...BlockCreation.defaults,
	id: "pidcontrollerblock",
	displayName: "Pid Controller",
	description: "Controller: P/I/D - proportional+integral+differential",
	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "PID"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
