import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { inferEnumLogicType } from "shared/blockLogic/BlockLogicTypes";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		impulse: {
			displayName: "Impulse",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true, // Because why
		},
		type: {
			displayName: "Type",
			types: {
				enum: inferEnumLogicType({
					config: "rtrig",
					elementOrder: ["rtrig", "ftrig", "both"],
					elements: {
						rtrig: { displayName: "Rise", tooltip: "Detects a rising edge of the input" },
						ftrig: { displayName: "Fall", tooltip: "Detects a falling edge of the input" },
						both: { displayName: "Both", tooltip: "Detects both edges of the input" },
					},
				}),
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

export type { Logic as SingleImpulseBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		let wasImpulsedLastTick = false;
		this.onTicc(() => {
			if (!wasImpulsedLastTick) return;
			this.output.value.set("bool", false);
		});

		let lastValue: boolean | undefined = undefined;
		this.onFirstInputs(({ impulse }) => {
			lastValue = impulse;
		});

		this.on(({ impulse, type: trig_side, impulseChanged }) => {
			// Proceed with normal logic after initialization
			if (!impulseChanged) return;

			if (lastValue === impulse) return;
			lastValue = impulse;

			if (trig_side === "both" || trig_side === "rtrig") {
				// R_Trig: Rising edge detected
				if (!impulse) return;

				wasImpulsedLastTick = true;
				this.output.value.set("bool", true);
			}
			if (trig_side === "both" || trig_side === "ftrig") {
				// F_Trig: Falling edge detected
				if (impulse) return;

				wasImpulsedLastTick = true;
				this.output.value.set("bool", true);
			}
		});
	}
}

export const SingleImpulseBlock = {
	...BlockCreation.defaults,
	id: "singleimpulse",
	displayName: "Signal Edge Detector",
	description: "Converts a bit into a pulse",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("GenericLogicBlockPrefab", "Edge Detector"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
