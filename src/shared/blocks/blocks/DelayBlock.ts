import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["value", "duration", "tickBased"],
	input: {
		value: {
			displayName: "Value",
			types: BlockConfigDefinitions.any,
			group: "0",
			configHidden: true,
		},
		duration: {
			displayName: "Duration",
			types: BlockConfigDefinitions.number,
		},
		tickBased: {
			displayName: "Delaying in ticks",
			tooltip: "Controls whether the duration is measued in ticks (true) or seconds (false)",
			types: BlockConfigDefinitions.bool,
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: asMap(BlockConfigDefinitions.any).keys(),
			group: "0",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type Wait = {
	left: number;
	readonly value: string | number | boolean | Vector3;
	readonly valueType: "string" | "number" | "bool" | "vector3" | "byte";
	readonly tickBased: boolean;
};

export type { Logic as DelayBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	private readonly tickWaits: Wait[] = [];

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		// let valueWasSet = false;
		this.on(({ value, valueType, valueChanged, duration, tickBased }) => {
			// should delay only when the value is changed
			if (!valueChanged) return;

			// DElETE BY THE RESULTS OF THE POLL
			// if (!valueWasSet) {
			// 	this.output.result.set(valueType, this.definition.input.value.types[valueType].config);
			// }
			// valueWasSet = true;

			this.tickWaits.push({ left: duration, value, valueType, tickBased });
		});

		const toRemove: Wait[] = [];
		this.onTick(({ dt }) => {
			for (const wait of this.tickWaits) {
				if (wait.left <= 0) {
					toRemove.push(wait);
					this.output.result.set(wait.valueType, wait.value);
					continue;
				}

				if (wait.tickBased) {
					wait.left--;
				} else {
					wait.left -= dt;

					if (wait.left <= 0) {
						toRemove.push(wait);
						this.output.result.set(wait.valueType, wait.value);
					}
				}
			}

			for (const wait of toRemove) {
				this.tickWaits.remove(this.tickWaits.indexOf(wait));
			}
			toRemove.clear();
		});
	}
}

export const DelayBlock = {
	...BlockCreation.defaults,
	id: "delayblock",
	displayName: "Delay Block",
	description: "Returns your value, but later",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "DELAY"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
