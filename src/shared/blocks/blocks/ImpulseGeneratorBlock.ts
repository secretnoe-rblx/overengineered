import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["delay", "isInverted", "isSinglePulse"],
	input: {
		delay: {
			displayName: "Delay (ticks)",
			types: {
				number: {
					config: 0,
				},
			},
		},
		isInverted: {
			displayName: "Invert",
			types: {
				bool: {
					config: false,
				},
			},
		},
		isSinglePulse: {
			displayName: "Single Pulse",
			types: {
				bool: {
					config: false,
				},
			},
		},
	},
	output: {
		value: {
			displayName: "Output",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as ImpulseGeneratorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const get = () => this.cached.getOutput("value").value;
		const set = (value: boolean) => this.output.value.set("bool", value);

		this.onk(["isInverted"], () => set(!get()));

		let impulses = 0;
		let didImpulse = false;
		this.onAlways(({ delay: thisDelay, isSinglePulse }) => {
			if (didImpulse) {
				set(!get());
				didImpulse = false;
			}

			impulses++;
			const delay = math.max(thisDelay, 1);
			impulses %= delay;
			if (impulses !== 0) return;

			didImpulse = isSinglePulse;
			set(!get());
		});
	}
}

export const ImpulseGeneratorBlock = {
	...BlockCreation.defaults,
	id: "impulsegenerator",
	displayName: "Impulse Generator",
	description: "A signal generator. Generates meander (a fancy way of saying square-shaped signal).",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
