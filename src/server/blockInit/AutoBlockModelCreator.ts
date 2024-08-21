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
	sqrt: {
		modelTextOverride: "SQRT",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	tan: {
		modelTextOverride: "TAN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	atan: {
		modelTextOverride: "ATAN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	sin: {
		modelTextOverride: "SIN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	asin: {
		modelTextOverride: "ASIN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	cos: {
		modelTextOverride: "COS",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	acos: {
		modelTextOverride: "ACOS",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	log: {
		modelTextOverride: "LOG",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	log10: {
		modelTextOverride: "LOG10",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	loge: {
		modelTextOverride: "LOG(E)",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	deg: {
		modelTextOverride: "DEG",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	rad: {
		modelTextOverride: "RAD",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	rand: {
		modelTextOverride: "RAND",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	pow: {
		modelTextOverride: "POW",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	nsqrt: {
		modelTextOverride: "NSQRT",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	atan2: {
		modelTextOverride: "ATAN2",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	equals: {
		modelTextOverride: "=",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	notequals: {
		modelTextOverride: "≠",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	greaterthan: {
		modelTextOverride: ">",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	greaterthanorequals: {
		modelTextOverride: "≥",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	lessthan: {
		modelTextOverride: "<",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	lessthanorequals: {
		modelTextOverride: "≤",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	bytenot: {
		modelTextOverride: "BNOT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteneg: {
		modelTextOverride: "BNEG",
		category: categories.byte,
		prefab: prefabs.smallByte,
	},

	bytexor: {
		modelTextOverride: "BXOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytexnor: {
		modelTextOverride: "BXNOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteand: {
		modelTextOverride: "BAND",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytenand: {
		modelTextOverride: "BNAND",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteor: {
		modelTextOverride: "BOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytenor: {
		modelTextOverride: "BNOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byterotateright: {
		modelTextOverride: "ROT. RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byterotateleft: {
		modelTextOverride: "ROT. LEFT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteshiftright: {
		modelTextOverride: "Shift RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteshiftleft: {
		modelTextOverride: "Shift LEFT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytearithmeticshiftright: {
		modelTextOverride: "Arithmetic Shift RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},

	xor: {
		modelTextOverride: "XOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	xnor: {
		modelTextOverride: "XNOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	and: {
		modelTextOverride: "AND",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	nand: {
		modelTextOverride: "NAND",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	or: {
		modelTextOverride: "OR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	nor: {
		modelTextOverride: "NOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},

	not: {
		modelTextOverride: "NOT",
		category: categories.bool,
		prefab: prefabs.smallGeneric,
	},

	numbertobyte: {
		modelTextOverride: "TO BYTE",
		category: categories.converterByte,
		prefab: prefabs.smallGeneric,
	},

	bytetonumber: {
		modelTextOverride: "TO NUMBER",
		category: categories.converterByte,
		prefab: prefabs.smallByte,
	},

	vec3combiner: {
		modelTextOverride: "VEC3 COMB",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	vec3splitter: {
		modelTextOverride: "VEC3 SPLIT",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	vec3objectworldtransformer: {
		modelTextOverride: "VEC3 OBJ/WLD",
		category: categories.converterVector,
		prefab: prefabs.doubleGeneric,
	},

	multiplexer: {
		modelTextOverride: "MUX",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	counter: {
		modelTextOverride: "COUNTER",
		category: categories.other,
		prefab: prefabs.x4Generic,
	},
	delayblock: {
		modelTextOverride: "DELAY",
		category: categories.other,
		prefab: prefabs.doubleGeneric,
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
