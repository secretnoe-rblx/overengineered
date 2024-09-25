import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Objects } from "shared/fixes/objects";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["read", "write", "address", "value"],
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

export type { Logic as RandomAccessMemoryBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		type PrimitiveKeys = keyof BlockLogicTypes.Primitives;

		const size = 0xff;
		const internalMemory: { readonly value: unknown; readonly type: PrimitiveKeys }[] = [];

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
			this.output.size.set("number", internalMemory.size());
		};

		const readValue = (address: number) => {
			if (!isReady(address)) return;

			const value = internalMemory[address];
			if (value === undefined) {
				this.disableAndBurn();
				return;
			}

			this.output.result.set(value.type as "string", value.value as string);
			this.output.size.set("number", internalMemory.size());
		};

		this.on(({ read, write, address, value, valueType }) => {
			if (read) {
				readValue(address);
			} else if (write) {
				writeValue(address, value, valueType);
			}
		});
	}
}

export const RandomAccessMemoryBlock = {
	...BlockCreation.defaults,
	id: "randomaccessmemory",
	displayName: "RAM",
	description: "An addressed memory. Allows you to store up to 256 values",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
