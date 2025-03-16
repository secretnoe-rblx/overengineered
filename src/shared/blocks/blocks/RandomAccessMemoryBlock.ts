import { Objects } from "engine/shared/fixes/Objects";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["read", "write", "address", "value", "clear"],
	outputOrder: ["result", "size"],
	input: {
		read: {
			displayName: "Read",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		write: {
			displayName: "Write",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		address: {
			displayName: "Address",
			types: {
				number: {
					config: 0,
				},
			},
		},
		value: {
			displayName: "Input",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
		clear: {
			displayName: "Clear",
			types: BlockConfigDefinitions.bool,
			configHidden: true,
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

export const size = 0xffff;

export type { Logic as RandomAccessMemoryBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		type PrimitiveKeys = keyof BlockLogicTypes.Primitives;

		const internalMemory: { [k in number]: { readonly value: unknown; readonly type: PrimitiveKeys } } = {};
		this.output.size.set("number", 0);

		const isReady = (address: number) => {
			const isInRange = address <= size && address >= 0;
			if (!isInRange) {
				this.disableAndBurn();
			}

			return isInRange;
		};

		const writeValue = (address: number, value: unknown, valueType: PrimitiveKeys) => {
			if (!isReady(address)) return;

			internalMemory[address] = { value, type: valueType };
			this.output.size.set("number", asMap(internalMemory).size());
		};

		const readValue = (address: number) => {
			if (!isReady(address)) return;

			const value = internalMemory[address];
			if (value === undefined) {
				// this.disableAndBurn();
				return;
			}

			this.output.result.set(value.type as "string", value.value as string);
			this.output.size.set("number", asMap(internalMemory).size());
		};

		this.onk(["read", "write", "address", "value"], ({ read, write, address, value, valueType }) => {
			if (read) {
				readValue(address);
			} else if (write) {
				writeValue(address, value, valueType);
			}
		});
		this.onk(["clear"], ({ clear, clearChanged }) => {
			if (clearChanged && clear) {
				asMap(internalMemory).clear();

				this.output.result.unset();
				this.output.size.set("number", asMap(internalMemory).size());
			}
		});
	}
}

export const RandomAccessMemoryBlock = {
	...BlockCreation.defaults,
	id: "randomaccessmemory",
	displayName: "RAM",
	description: `An addressed memory. Allows you to store up to ${size} values`,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
