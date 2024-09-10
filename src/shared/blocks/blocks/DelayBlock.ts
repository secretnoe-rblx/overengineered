import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Strings } from "shared/fixes/String.propmacro";
import type {
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
	BlockLogicTickContext,
} from "shared/blockLogic/BlockLogic";
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
			types: {
				number: {
					config: 1,
				},
			},
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
class Logic extends BlockLogic<typeof definition> {
	private readonly tickWaits: Wait[] = [];

	constructor(block: BlockLogicArgs) {
		super(definition, block);

		this.on(({ value, valueType, valueChanged, duration, tickBased }) => {
			// should delay only when the value is changed
			if (!valueChanged) return;
			this.tickWaits.push({ left: duration, value, valueType, tickBased });
		});

		const toRemove: Wait[] = [];
		this.onTicc(({ dt }) => {
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

	getDebugInfo(ctx: BlockLogicTickContext): readonly string[] {
		const minBy = <T>(arr: T[], func: (value: T) => number) => {
			let min: T | undefined = undefined;
			for (const value of arr) {
				if (min === undefined) {
					min = value;
					continue;
				}

				if (func(min) > func(value)) {
					min = value;
				}
			}

			return min;
		};

		return [
			...super.getDebugInfo(ctx),
			`Waiting ${this.tickWaits.size()} waits`,
			`Closest wait: ${Strings.pretty(minBy(this.tickWaits, (t) => t.left))}`,
		];
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
