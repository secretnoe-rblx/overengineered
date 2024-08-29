import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Objects } from "shared/fixes/objects";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["value", "push", "pop"],
	outputOrder: ["result", "size"],
	input: {
		push: {
			displayName: "Push",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		pop: {
			displayName: "Pop",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		value: {
			displayName: "Input",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
	},
	output: {
		size: {
			displayName: "Size",
			types: ["number"],
		},
		result: {
			displayName: "Output",
			types: Objects.keys(BlockConfigDefinitions.any),
			group: "1",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as StackMemoryBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		type PrimitiveKeys = keyof BlockLogicTypes.Primitives;

		const size = 32;
		const internalMemory: { readonly value: unknown; readonly type: PrimitiveKeys }[] = [];

		const pushValue = (value: unknown, valueType: PrimitiveKeys) => {
			if (internalMemory.size() >= size) {
				this.disableAndBurn();
				return;
			}

			internalMemory.push({ value, type: valueType });
			this.output.size.set("number", internalMemory.size());
		};

		const popValue = () => {
			const value = internalMemory.pop();
			if (value === undefined) {
				this.disableAndBurn();
				return;
			}

			this.output.result.set(value.type as never, value.value as never);
			this.output.size.set("number", internalMemory.size());
		};

		this.onk(["pop"], ({ pop }) => {
			if (!pop) return;
			popValue();
		});

		this.onk(["push", "value"], ({ push, value, valueType }) => {
			if (!push) return;
			pushValue(value, valueType);
		});
	}
}

export const StackMemoryBlock = {
	...BlockCreation.defaults,
	id: "stackmemory",
	displayName: "Stack",
	description: "Storage for your stacked data. Allows to store up to 32 values",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
