import { BlockLogic } from "shared/blockLogic/BlockLogic";
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
		this.on(({ impulse, impulseChanged }) => {
			if (!impulseChanged) return;

			if (lastValue === impulse) return;
			lastValue = impulse;

			if (!impulse) return;

			wasImpulsedLastTick = true;
			this.output.value.set("bool", true);
		});
	}
}

export const SingleImpulseBlock = {
	...BlockCreation.defaults,
	id: "singleimpulse",
	displayName: "Single Impulse",
	description: "Converts a bit into a pulse",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("GenericLogicBlockPrefab", "SINGLE IMPULSE"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
