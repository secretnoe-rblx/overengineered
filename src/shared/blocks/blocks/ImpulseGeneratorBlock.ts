import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type {
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
	BlockLogicTickContext,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["delay", "isInverted", "isSinglePulse"],
	input: {
		delay: {
			displayName: "Interval",
			unit: "Tick",
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
	private impulseProgress = 0;
	private didImpulse = false;
	private impulseDelay?: number;

	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const get = () => this.output.value.justGet().value;
		const set = (value: boolean) => this.output.value.set("bool", value);

		this.onk(["isInverted"], ({ isInverted }) => set(!isInverted));

		this.onAlwaysInputs(({ delay, isSinglePulse }) => {
			this.impulseDelay = delay;

			if (this.didImpulse) {
				set(!get());
				this.didImpulse = false;
			}

			this.impulseProgress++;
			delay = math.max(delay, 1);
			this.impulseProgress %= delay;
			if (this.impulseProgress !== 0) return;

			this.didImpulse = isSinglePulse;
			set(!get());
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

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
