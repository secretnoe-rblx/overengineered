import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type {
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
	BlockLogicTickContext,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["delay", "delay_low", "isInverted", "isSinglePulse"],
	input: {
		delay: {
			//не переименовывал чтоб совметимость была
			displayName: "High Level Length",
			unit: "Tick",
			types: {
				number: {
					config: 1,
				},
			},
		},
		delay_low: {
			displayName: "Low Level Length",
			unit: "Tick",
			types: {
				number: {
					config: 1,
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
			connectorHidden: true,
		},
		isSinglePulse: {
			displayName: "Single Pulse",
			tooltip: "",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
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
	private impulseProgress = -1;
	private impulseDelay = 0;

	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const set = (value: boolean) => this.output.value.set("bool", value);

		this.onk(["isInverted"], ({ isInverted }) => set(!isInverted));

		this.onAlwaysInputs(({ delay, delay_low, isSinglePulse, isInverted }) => {
			this.impulseDelay = delay; //for debugging or sum sh$t

			delay = math.max(delay, 1);
			delay_low = math.max(delay_low, 1);

			const len = delay + delay_low;
			this.impulseProgress = ++this.impulseProgress % len;

			const res = this.impulseProgress < (isSinglePulse ? 1 : delay);
			set(!res !== !isInverted); //xor (a.k.a. управляемая инверсия)
		});
	}

	getDebugInfo(ctx: BlockLogicTickContext): readonly string[] {
		return [...super.getDebugInfo(ctx), `Progress: ${this.impulseProgress}/${this.impulseDelay}`];
	}
}

export const ImpulseGeneratorBlock = {
	...BlockCreation.defaults,
	id: "impulsegenerator",
	displayName: "Impulse Generator",
	description: "A signal generator. Generates meander (a fancy way of saying square-shaped signal).",
	search: {
		partialAliases: ["clock"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
