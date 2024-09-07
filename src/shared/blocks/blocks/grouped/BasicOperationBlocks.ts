import { RunService } from "@rbxts/services";
import { CalculatableBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { MathUtils } from "shared/fixes/MathUtils";
import type {
	BlockLogicBothDefinitions,
	BlockLogicArgs,
	AllInputKeysToObject,
	AllOutputKeysToObject,
	BlockLogicFullBothDefinitions,
	BlockLogicFullInputDef,
} from "shared/blockLogic/BlockLogic";
import type {
	BlockBuildersWithoutIdAndDefaults,
	BlockCategoryPath,
	BlockLogicInfo,
	BlockModelSource,
} from "shared/blocks/Block";

type CalcFunc<TDef extends BlockLogicBothDefinitions> = (
	inputs: AllInputKeysToObject<TDef["input"]>,
	block: AutoCalculatableBlock<TDef>,
) => AllOutputKeysToObject<TDef["output"]> | BlockLogicValueResults;

class AutoCalculatableBlock<TDef extends BlockLogicBothDefinitions> extends CalculatableBlockLogic<TDef> {
	constructor(
		definition: TDef,
		args: BlockLogicArgs,
		private readonly calcfunc: CalcFunc<TDef>,
	) {
		super(definition, args);
	}

	protected override calculate(
		inputs: AllInputKeysToObject<TDef["input"]>,
	): AllOutputKeysToObject<TDef["output"]> | BlockLogicValueResults {
		return this.calcfunc(inputs, this);
	}
}
const logic = <TDef extends BlockLogicFullBothDefinitions>(definition: TDef, calcfunc: CalcFunc<TDef>) => {
	class ctor extends AutoCalculatableBlock<TDef> {
		constructor(args: BlockLogicArgs) {
			super(definition, args, calcfunc);
		}
	}

	return { definition, ctor } satisfies BlockLogicInfo;
};

const autoModel = (prefab: BlockCreation.Model.PrefabName, text: string, category: BlockCategoryPath) => {
	return {
		model: BlockCreation.Model.fAutoCreated(prefab, text),
		category: () => category,
	} satisfies BlockModelSource;
};

const categories = BlockCreation.Categories;

//

type BLFID = Partial<Omit<BlockLogicFullInputDef, "displayName" | "types">>;
const defpartsf = {
	any: (name: string, rest?: BLFID) => ({
		displayName: name,
		types: BlockConfigDefinitions.any,
		...(rest ?? {}),
	}),
	number: (name: string, rest?: BLFID) => ({
		displayName: name,
		types: BlockConfigDefinitions.number,
		...(rest ?? {}),
	}),
	bool: (name: string, rest?: BLFID) => ({
		displayName: name,
		types: BlockConfigDefinitions.bool,
		...(rest ?? {}),
	}),
	byte: (name: string, rest?: BLFID) => ({
		displayName: name,
		types: BlockConfigDefinitions.byte,
		...(rest ?? {}),
	}),
	vector3: (name: string, rest?: BLFID) => ({
		displayName: name,
		types: BlockConfigDefinitions.vector3,
		...(rest ?? {}),
	}),
} as const satisfies {
	readonly [k in string]: (name: string, rest?: BLFID) => BlockLogicFullInputDef;
};
const defs = {
	equality: {
		input: {
			value1: {
				displayName: "Value 1",
				types: {
					number: { config: 0 as number },
					bool: { config: false as boolean },
					byte: { config: 0 as number },
				},
			},
			value2: {
				displayName: "Value 2",
				types: {
					number: { config: 0 as number },
					bool: { config: false as boolean },
					byte: { config: 0 as number },
				},
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	num2_bool: {
		input: {
			value1: defpartsf.number("Value"),
			value2: defpartsf.number("Value"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	num1_num: {
		input: {
			value: defpartsf.number("Value"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["number"],
			},
		},
	},
	num2_num: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: defpartsf.number("Value 1"),
			value2: defpartsf.number("Value 2"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["number"],
			},
		},
	},
	bool1_bool: {
		input: {
			value: defpartsf.bool("Value"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	bool2_bool: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: defpartsf.bool("Value 1"),
			value2: defpartsf.bool("Value 2"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	byte1_byte: {
		input: {
			value: defpartsf.byte("Value"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["byte"],
			},
		},
	},
	byte2_byte: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: defpartsf.byte("Value 1"),
			value2: defpartsf.byte("Value 2"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["byte"],
			},
		},
	},
	byteshift: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: defpartsf.byte("Value"),
			value2: defpartsf.byte("Shift"),
		},
		output: {
			result: {
				displayName: "Result",
				types: ["byte"],
			},
		},
	},
	constnum: {
		input: {},
		output: {
			value: {
				displayName: "Value",
				types: ["number"],
			},
		},
	},
} as const satisfies { readonly [k in string]: BlockLogicFullBothDefinitions };

//

const constants = {
	constant: {
		displayName: "Constant",
		description: "Returns the value you've set",
		modelSource: autoModel("ConstLogicBlockPrefab", "CONST", BlockCreation.Categories.other),
		logic: logic(
			{
				input: {
					value: {
						displayName: "Value",
						group: "0",
						types: BlockConfigDefinitions.any,
						connectorHidden: true,
					},
				},
				output: {
					result: {
						displayName: "Result",
						group: "0",
						types: asMap(BlockConfigDefinitions.any).keys(),
					},
				},
			},
			(input) => ({ result: { type: input.valueType, value: input.value } }),
		),
	},
	pi: {
		displayName: "Pi",
		description: `So called "free thinkers" will make a thousand PIe jokes as soon as they'll see the PI constant..`,
		modelSource: autoModel("ConstLogicBlockPrefab", "π", BlockCreation.Categories.other),
		logic: logic(defs.constnum, (ctx) => {
			print("pi", ctx);
			return { value: { type: "number", value: math.pi } };
		}),
	},
	e: {
		displayName: "Euler's number (e)",
		description: "Very useful constant you'll probably never use if you doesn't already know what it is",
		modelSource: autoModel("ConstLogicBlockPrefab", "e", BlockCreation.Categories.other),
		logic: logic(defs.constnum, () => ({ value: { type: "number", value: MathUtils.e } })),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const maths = {
	abs: {
		displayName: "Absolute",
		description: "Returns the modulus of incoming number",
		modelSource: autoModel("GenericLogicBlockPrefab", "ABS", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.abs(value) },
		})),
	},
	round: {
		displayName: "Round",
		description: "Returns rounded input value",
		modelSource: autoModel("GenericLogicBlockPrefab", "ABS", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.round(value) },
		})),
	},
	floor: {
		displayName: "Floor",
		description: "N/A", // TODO: <
		modelSource: autoModel("GenericLogicBlockPrefab", "FLOOR", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.floor(value) },
		})),
	},
	ceil: {
		displayName: "Ceil",
		description: "N/A", // TODO: <
		modelSource: autoModel("GenericLogicBlockPrefab", "CEIL", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.ceil(value) },
		})),
	},
	sign: {
		displayName: "Sign",
		description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
		modelSource: autoModel("GenericLogicBlockPrefab", "SIGN", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.sign(value) },
		})),
	},
	sqrt: {
		displayName: "Square Root",
		description: "Square the root out of input value",
		modelSource: autoModel("GenericLogicBlockPrefab", "SQRT", categories.math),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.sqrt(value) },
		})),
	},

	add: {
		displayName: "Addition",
		description: "Returns a sum of input values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "ADD", categories.math),
		logic: logic(defs.num2_num, ({ value1, value2 }) => ({
			result: { type: "number", value: value1 + value2 },
		})),
	},
	sub: {
		displayName: "Subtraction",
		description: "Returns the result of substruction of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "SUB", categories.math),
		logic: logic(
			{
				inputOrder: ["value1", "value2"],
				input: {
					value1: defpartsf.number("Value"),
					value2: defpartsf.number("Subtrahend"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value1, value2 }) => ({
				result: { type: "number", value: value1 - value2 },
			}),
		),
	},
	mul: {
		displayName: "Multiplication",
		description: "Returns the result of multiplication of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "MUL", categories.math),
		logic: logic(defs.num2_num, ({ value1, value2 }) => ({
			result: { type: "number", value: value1 * value2 },
		})),
	},
	div: {
		displayName: "Division",
		description: "Returns the result of division of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "DIV", categories.math),
		logic: logic(
			{
				inputOrder: ["value1", "value2"],
				input: {
					value1: defpartsf.number("Value"),
					value2: defpartsf.number("Divider"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value1, value2 }, logic) => {
				if (value2 === 0) {
					logic.disableAndBurn();
					return BlockLogicValueResults.garbage;
				}

				return { result: { type: "number", value: value1 / value2 } };
			},
		),
	},
	mod: {
		displayName: "Mod",
		description: "Returns the remainder of a division",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "MOD", categories.math),
		logic: logic(defs.num2_num, (inputs, logic) => {
			if (inputs.value2 === 0) {
				logic.disableAndBurn();
				return BlockLogicValueResults.garbage;
			}

			return { result: { type: "number", value: inputs.value1 % inputs.value2 } };
		}),
	},

	nsqrt: {
		displayName: "Custom Degree Root",
		description: "Same as the square root but you're allowed to change the degree of it",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NSQRT", categories.math),
		logic: logic(
			{
				inputOrder: ["value", "root"],
				input: {
					value: defpartsf.number("Value"),
					root: defpartsf.number("Degree"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value, root }) => ({
				result: { type: "number", value: value ** (1 / root) },
			}),
		),
	},
	pow: {
		displayName: "Power",
		description: "Buffs input values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "POW", categories.math),
		logic: logic(
			{
				inputOrder: ["value", "power"],
				input: {
					value: defpartsf.number("Value"),
					power: defpartsf.number("Power"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value, power }) => ({
				result: { type: "number", value: math.pow(value, power) },
			}),
		),
	},
	clamp: {
		displayName: "Clamp",
		description: "Limits the output between max and min.",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "CLAMP", categories.math),
		logic: logic(
			{
				inputOrder: ["value", "min", "max"],
				input: {
					value: defpartsf.number("Value"),
					min: defpartsf.number("Min"),
					max: defpartsf.number("Max"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value, min, max }) => ({
				result: { type: "number", value: math.clamp(value, min, max) },
			}),
		),
	},
	rand: {
		displayName: "Random",
		description: `Returns a "random" value between chosen minimum and maximum`,
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "RAND", categories.math),
		logic: logic(
			{
				inputOrder: ["value", "min", "max"],
				input: {
					value: defpartsf.number("Value"),
					min: defpartsf.number("Min"),
					max: defpartsf.number("Max"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ min, max }, logic) => {
				if (max <= min) {
					logic.disableAndBurn();
					return BlockLogicValueResults.garbage;
				}

				return { result: { type: "number", value: math.random() * (max - min) + min } };
			},
		),
	},

	equals: {
		displayName: "Equals",
		description: "Returns true if two given values are the exact same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "=", categories.math),
		logic: logic(defs.equality, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 === value2 },
		})),
	},
	notequals: {
		displayName: "Not Equals",
		description: "Returns true if two given values are not the same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "≠", categories.math),
		logic: logic(defs.equality, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 !== value2 },
		})),
	},

	greaterthan: {
		displayName: "Greater Than",
		description: "Returns true if first value greater than second one",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", ">", categories.math),
		logic: logic(defs.num2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 > value2 },
		})),
	},
	lessthan: {
		displayName: "Less Than",
		description: "Returns true if the first value or lesser than second one",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "<", categories.math),
		logic: logic(defs.num2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 < value2 },
		})),
	},
	greaterthanorequals: {
		displayName: "Greater Than or Equals",
		description: "Returns true if the first value greater than second one",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "≥", categories.math),
		logic: logic(defs.num2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 >= value2 },
		})),
	},
	lessthanorequals: {
		displayName: "Less Than or Equals",
		description: "Returns true if the first value equal to or lesser than second one",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "≤", categories.math),
		logic: logic(defs.num2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 <= value2 },
		})),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const trigonometry = {
	sin: {
		displayName: "Sine",
		description: "Calculates a sine of input",
		modelSource: autoModel("GenericLogicBlockPrefab", "SIN", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.sin(value) },
		})),
	},
	cos: {
		displayName: "Cosine",
		description: "Calculates a cosine of input",
		modelSource: autoModel("GenericLogicBlockPrefab", "COS", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.cos(value) },
		})),
	},
	tan: {
		displayName: "Tangent",
		description: "Calculates a tangent of input",
		modelSource: autoModel("GenericLogicBlockPrefab", "TAN", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.tan(value) },
		})),
	},
	asin: {
		displayName: "Arcsine",
		description: "The opposite of the Sine",
		modelSource: autoModel("GenericLogicBlockPrefab", "ASIN", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.asin(value) },
		})),
	},
	acos: {
		displayName: "Arccosine",
		description: "The opposite of the Cosine",
		modelSource: autoModel("GenericLogicBlockPrefab", "ACOS", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.acos(value) },
		})),
	},
	atan: {
		displayName: "Arctangent",
		description: "The opposite of the Tangent",
		modelSource: autoModel("GenericLogicBlockPrefab", "ATAN", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.atan(value) },
		})),
	},
	deg: {
		displayName: "To degrees",
		description: "Returns input value converted from radians to degrees",
		modelSource: autoModel("GenericLogicBlockPrefab", "DEG", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.deg(value) },
		})),
	},
	rad: {
		displayName: "To radians",
		description: "Returns input value converted from degrees to to radians",
		modelSource: autoModel("GenericLogicBlockPrefab", "RAD", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.rad(value) },
		})),
	},
	log: {
		displayName: "Logarithm",
		description: "Calculates a logarithm of the input value with selected base",
		modelSource: autoModel("GenericLogicBlockPrefab", "LOG", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.log(value) },
		})),
	},
	log10: {
		displayName: "Logarithm (10 base)",
		description: "Calculates a base 10 logarithm of the input value",
		modelSource: autoModel("GenericLogicBlockPrefab", "LOG(10)", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.log10(value) },
		})),
	},
	loge: {
		displayName: "Logarithm (Natural)",
		description: "Returns a natural Logarithm of inputed value. Unlike it's evil artificial counterparts..",
		modelSource: autoModel("GenericLogicBlockPrefab", "LOG(E)", categories.trigonometry),
		logic: logic(defs.num1_num, ({ value }) => ({
			result: { type: "number", value: math.log(value, 2.718281828459) },
		})),
	},

	atan2: {
		displayName: "Arctangent 2",
		description: "No way they made a sequel",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "ATAN2", categories.trigonometry),
		logic: logic(
			{
				inputOrder: ["y", "x"],
				input: {
					y: defpartsf.number("Y"),
					x: defpartsf.number("X"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ y, x }) => ({
				result: { type: "number", value: math.atan2(y, x) },
			}),
		),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const vec3 = {
	vec3combiner: {
		displayName: "Vector3 Combiner",
		description: "Returns a vector combined from input values",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "VEC3 COMB", categories.converterVector),
		logic: logic(
			{
				inputOrder: ["value_x", "value_y", "value_z"],
				input: {
					value_x: defpartsf.number("X"),
					value_y: defpartsf.number("Y"),
					value_z: defpartsf.number("Z"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["vector3"],
					},
				},
			},
			({ value_x, value_y, value_z }) => ({
				result: { type: "vector3", value: new Vector3(value_x, value_y, value_z) },
			}),
		),
	},
	vec3splitter: {
		displayName: "Vector3 Splitter",
		description: "Returns vector values",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "VEC3 SPLIT", categories.converterVector),
		logic: logic(
			{
				outputOrder: ["result_x", "result_y", "result_z"],
				input: {
					value: defpartsf.vector3("Value"),
				},
				output: {
					result_x: {
						displayName: "X",
						types: ["number"],
					},
					result_y: {
						displayName: "Y",
						types: ["number"],
					},
					result_z: {
						displayName: "Z",
						types: ["number"],
					},
				},
			},
			({ value }) => ({
				result_x: { type: "number", value: value.X },
				result_y: { type: "number", value: value.Y },
				result_z: { type: "number", value: value.Z },
			}),
		),
	},
	vec3objectworldtransformer: {
		displayName: "Vector3 Object/World Transformer",
		description: "Converts a vector into the world/object coordinate space of the other vector",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "VEC3 OBJ/WLD", categories.converterVector),
		logic: logic(
			{
				inputOrder: ["toobject", "originpos", "originrot", "position"],
				input: {
					toobject: {
						displayName: "To object?",
						types: BlockConfigDefinitions.bool,
					},
					originpos: {
						displayName: "Origin position",
						types: BlockConfigDefinitions.vector3,
					},
					originrot: {
						displayName: "Origin rotation",
						types: BlockConfigDefinitions.vector3,
					},
					position: {
						displayName: "Position",
						types: BlockConfigDefinitions.vector3,
					},
				},
				output: {
					position: {
						displayName: "Result",
						types: ["vector3"],
					},
				},
			},
			({ toobject, originpos, originrot, position }) => {
				const origin = new CFrame(originpos).mul(CFrame.fromOrientation(originrot.X, originrot.Y, originrot.Z));
				const result = toobject ? origin.PointToObjectSpace(position) : origin.PointToWorldSpace(position);

				return { position: { type: "vector3", value: result } };
			},
		),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const bool = {
	not: {
		displayName: "NOT Gate",
		description: "Returns true when false is given, and vice versa",
		modelSource: autoModel("GenericLogicBlockPrefab", "NOT", categories.bool),
		logic: logic(defs.bool1_bool, ({ value }) => ({
			result: { type: "bool", value: !value },
		})),
	},

	and: {
		displayName: "AND Gate",
		description: "Returns true when both inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "AND", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 && value2 },
		})),
	},
	or: {
		displayName: "OR Gate",
		description: "Returns true when any of the inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "OR", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 || value2 },
		})),
	},
	xor: {
		displayName: "XOR Gate",
		description: "Returns true when only one of the inputs is true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XOR", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: value1 !== value2 },
		})),
	},

	nand: {
		displayName: "NAND Gate",
		description: "Returns true when both inputs are not true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NAND", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: !(value1 && value2) },
		})),
	},
	nor: {
		displayName: "NOR Gate",
		description: "Returns true when none of the inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NOR", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: !(value1 || value2) },
		})),
	},
	xnor: {
		displayName: "XNOR Gate",
		description: "Returns true when both of the the inputs are the same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XNOR", categories.bool),
		logic: logic(defs.bool2_bool, ({ value1, value2 }) => ({
			result: { type: "bool", value: !(value1 !== value2) },
		})),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const byte = {
	numbertobyte: {
		displayName: "Number to Byte",
		description: "Converts number value to the byte value! It's like clamping number between 0 and 255.",
		modelSource: autoModel("ByteLogicBlockPrefab", "NUM TO BYTE", categories.converterByte),
		logic: logic(
			{
				input: {
					value: defpartsf.number("Value"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["byte"],
					},
				},
			},
			({ value }) => ({
				result: { type: "byte", value: math.clamp(value, 0, 255) },
			}),
		),
	},
	bytetonumber: {
		displayName: "Byte To Number",
		description: "Numbers the bytes! Oh, wait.. no.. It converts Bytes to numbers!",
		modelSource: autoModel("ByteLogicBlockPrefab", "BYTE TO NUM", categories.converterByte),
		logic: logic(
			{
				input: {
					value: defpartsf.byte("Value"),
				},
				output: {
					result: {
						displayName: "Result",
						types: ["number"],
					},
				},
			},
			({ value }) => ({
				result: { type: "number", value: value },
			}),
		),
	},
	bytemaker: {
		displayName: "Byte Maker",
		description: "Makes bytes from bits and pieces",
		logic: logic(
			{
				inputOrder: ["1", "2", "4", "8", "16", "32", "64", "128"],
				input: {
					"1": defpartsf.bool("1"),
					"2": defpartsf.bool("2"),
					"4": defpartsf.bool("4"),
					"8": defpartsf.bool("8"),
					"16": defpartsf.bool("16"),
					"32": defpartsf.bool("32"),
					"64": defpartsf.bool("64"),
					"128": defpartsf.bool("128"),
				},
				output: {
					value: {
						displayName: "Result",
						types: ["byte"],
					},
				},
			},
			(inputs) => {
				const byte =
					((inputs["1"] ? 1 : 0) << 0) &
					((inputs["2"] ? 1 : 0) << 1) &
					((inputs["4"] ? 1 : 0) << 2) &
					((inputs["8"] ? 1 : 0) << 3) &
					((inputs["16"] ? 1 : 0) << 4) &
					((inputs["32"] ? 1 : 0) << 5) &
					((inputs["64"] ? 1 : 0) << 6) &
					((inputs["128"] ? 1 : 0) << 7);

				return {
					value: { type: "byte", value: byte },
				};
			},
		),
	},
	bytesplitter: {
		displayName: "Byte Splitter",
		description: "Another one bytes to bits",
		logic: logic(
			{
				outputOrder: ["1", "2", "4", "8", "16", "32", "64", "128"],
				input: {
					value: defpartsf.byte("Byte"),
				},
				output: {
					"1": {
						displayName: "1",
						types: ["bool"],
					},
					"2": {
						displayName: "2",
						types: ["bool"],
					},
					"4": {
						displayName: "4",
						types: ["bool"],
					},
					"8": {
						displayName: "8",
						types: ["bool"],
					},
					"16": {
						displayName: "16",
						types: ["bool"],
					},
					"32": {
						displayName: "32",
						types: ["bool"],
					},
					"64": {
						displayName: "64",
						types: ["bool"],
					},
					"128": {
						displayName: "128",
						types: ["bool"],
					},
				},
			},
			({ value }) => {
				return {
					"1": { type: "bool", value: ((value >> 0) & 1) === 1 },
					"2": { type: "bool", value: ((value >> 1) & 1) === 1 },
					"4": { type: "bool", value: ((value >> 2) & 1) === 1 },
					"8": { type: "bool", value: ((value >> 3) & 1) === 1 },
					"16": { type: "bool", value: ((value >> 4) & 1) === 1 },
					"32": { type: "bool", value: ((value >> 5) & 1) === 1 },
					"64": { type: "bool", value: ((value >> 6) & 1) === 1 },
					"128": { type: "bool", value: ((value >> 7) & 1) === 1 },
				};
			},
		),
	},

	bytenot: {
		displayName: "Byte NOT",
		description: "It's the same NOT operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BNOT", categories.byte),
		logic: logic(defs.byte1_byte, ({ value }) => ({
			result: { type: "byte", value: ~value & 0xff },
		})),
	},
	byteneg: {
		displayName: "Byte NEGATE",
		description: "Negates the input byte.",
		modelSource: autoModel("ByteLogicBlockPrefab", "BNEG", categories.byte),
		logic: logic(defs.byte1_byte, ({ value }) => ({
			result: { type: "byte", value: -value & 0xff },
		})),
	},

	bytexor: {
		displayName: "Byte XOR",
		description: "It's the same XOR operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BXOR", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: value1 ^ value2 },
		})),
	},
	bytexnor: {
		displayName: "Byte XNOR",
		description: "It's the same XNOR operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BXNOR", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: ~(value1 ^ value2) & 0xff },
		})),
	},
	byteand: {
		displayName: "Byte AND",
		description: "It's the same AND operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BAND", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: value1 & value2 },
		})),
	},
	bytenand: {
		displayName: "Byte NAND",
		description: "It's the same NAND operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BNAND", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: ~(value1 & value2) & 0xff },
		})),
	},
	byteor: {
		displayName: "Byte OR",
		description: "It's the same OR operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BOR", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: value1 | value2 },
		})),
	},
	bytenor: {
		displayName: "Byte NOR",
		description: "It's the same NOR operation but for each bit of input bytes.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BNOR", categories.byte),
		logic: logic(defs.byte2_byte, ({ value1, value2 }) => ({
			result: { type: "byte", value: ~(value1 | value2) & 0xff },
		})),
	},
	byterotateright: {
		displayName: "Byte Rotate Right",
		description: "It rotates the byte right! Don't ask me, don't know either",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BRR", categories.byte),
		logic: logic(defs.byteshift, ({ value1: num, value2: shift }) => ({
			result: { type: "byte", value: ((num >>> shift) | (num << (8 - shift))) & 0xff },
		})),
	},
	byterotateleft: {
		displayName: "Byte Rotate Left",
		description: "It rotates the left! Don't ask me, don't know either",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BRL", categories.byte),
		logic: logic(defs.byteshift, ({ value1: num, value2: shift }) => ({
			result: { type: "byte", value: ((num << shift) | (num >>> (8 - shift))) & 0xff },
		})),
	},
	byteshiftright: {
		displayName: "Byte Shift Right",
		description: "Shifts bits to right!",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BSHR", categories.byte),
		logic: logic(defs.byteshift, ({ value1: num, value2: shift }) => ({
			result: { type: "byte", value: (num >> shift) & 0xff },
		})),
	},
	byteshiftleft: {
		displayName: "Byte Shift Left",
		description: "Shifts bits to left!",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BSHL", categories.byte),
		logic: logic(defs.byteshift, ({ value1: num, value2: shift }) => ({
			result: { type: "byte", value: (num << shift) & 0xff },
		})),
	},
	bytearithmeticshiftright: {
		displayName: "Byte Arithmetic Shift Right",
		description: "Honestly, I have ZERO idea what it does, Maks made it.",
		modelSource: autoModel("DoubleByteLogicBlockPrefab", "BASHR", categories.byte),
		logic: logic(defs.byteshift, ({ value1: num, value2: shift }) => ({
			result: { type: "byte", value: (num >> shift) | ((num & 0x80) !== 0 ? 0xff << (8 - shift) : 0) },
		})),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const other = {
	buffer: {
		displayName: "Buffer",
		description: "Returns the same value it was given. Useful for logic organization",
		logic: logic(
			{
				input: {
					value: defpartsf.any("Value", { group: "1" }),
				},
				output: {
					result: {
						displayName: "Result",
						types: asMap(BlockConfigDefinitions.any).keys(),
						group: "1",
					},
				},
			},
			({ value, valueType }) => ({
				result: { type: valueType, value },
			}),
		),
	},
	multiplexer: {
		displayName: "Multiplexer",
		description: "Outputs values depending on the incoming boolean",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "MUX", categories.other),
		logic: logic(
			{
				inputOrder: ["value", "truevalue", "falsevalue"],
				input: {
					value: defpartsf.bool("State"),
					truevalue: defpartsf.any("True value", { group: "1" }),
					falsevalue: defpartsf.any("False value", { group: "1" }),
				},
				output: {
					result: {
						displayName: "Result",
						types: asMap(BlockConfigDefinitions.any).keys(),
						group: "1",
					},
				},
			},
			({ value, truevalue, falsevalue, truevalueType, falsevalueType }) => ({
				result: { type: value ? truevalueType : falsevalueType, value: value ? truevalue : falsevalue },
			}),
		),
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

const test: {} = !RunService.IsStudio()
	? {}
	: ({
			testblock: {
				displayName: "TEST BLOCK",
				description: "Test block to test the block; Studio only",
				modelSource: {
					model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "TEST"),
					category: () => [],
				},
				logic: logic(
					{
						input: {
							value: {
								displayName: "Value",
								types: {
									number: {
										config: 0,
										control: {
											min: 0.15,
											max: 10,
											config: {
												enabled: true,
												extended: false,
												startValue: 0,
												mode: {
													type: "smooth",
													speed: 1,
												},
												keys: [
													{ key: "R", value: 10 },
													{ key: "F", value: 0.15 },
												],
											},
										},
									},
								},
							},
						},
						output: {
							result: {
								displayName: "Result",
								types: ["number"],
							},
						},
					},
					({ value, valueType }) => ({
						result: { type: valueType, value },
					}),
				),
			},
		} as const satisfies BlockBuildersWithoutIdAndDefaults);

//

const list = {
	...maths,
	...constants,
	...trigonometry,
	...vec3,
	...bool,
	...byte,
	...other,
	...test,
} satisfies BlockBuildersWithoutIdAndDefaults;
export const BasicOperationBlocks = BlockCreation.arrayFromObject(list);

export type BasicOperationBlockIds = keyof typeof list;
