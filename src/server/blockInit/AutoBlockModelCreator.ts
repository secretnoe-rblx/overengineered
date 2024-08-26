import type { BlockCategoryPath } from "shared/blocks/Block";
import type { BlockCreation } from "shared/blocks/BlockCreation";

interface CreateInfo {
	readonly modelTextOverride: string;
	readonly category: BlockCategoryPath;
	readonly prefab: BlockCreation.Model.PrefabName;
	readonly required?: boolean;
	readonly limit?: number;
}

const prefabs = {
	const: "ConstLogicBlockPrefab",
	smallGeneric: "GenericLogicBlockPrefab",
	doubleGeneric: "DoubleGenericLogicBlockPrefab",
	tripleGeneric: "TripleGenericLogicBlockPrefab",
	x4Generic: "x4GenericLogicBlockPrefab",
	smallByte: "ByteLogicBlockPrefab",
	doubleByte: "DoubleByteLogicBlockPrefab",
} as const satisfies { [k in string]: `${string}BlockPrefab` };

const categories = {
	math: ["Logic", "Math"],
	byte: ["Logic", "Math", "Byte"],
	converterByte: ["Logic", "Converter", "Byte"],
	converterVector: ["Logic", "Converter", "Vector"],
	other: ["Logic", "Other"],
	bool: ["Logic", "Gate"],
	memory: ["Logic", "Memory"],
} as const satisfies { [k in string]: BlockCategoryPath };

const operations = {
	counter: {
		modelTextOverride: "COUNTER",
		category: categories.other,
		prefab: prefabs.x4Generic,
	},
	logicmemory: {
		modelTextOverride: "MEMORY",
		category: categories.memory,
		prefab: prefabs.doubleGeneric,
	},

	singleimpulse: {
		modelTextOverride: "SINGLE IMPULSE",
		category: categories.other,
		prefab: prefabs.smallGeneric,
	},
	tpscounter: {
		modelTextOverride: "TPS",
		category: categories.other,
		prefab: prefabs.const,
	},
} as const satisfies NonGenericOperations;
export type AutoCreatedOperations = typeof operations;

type NonGenericOperations = { readonly [k in string]: CreateInfo };

// TODO: delete this file; currently left for the values to be copied
