import { CalculatableBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RemoteEvents } from "shared/RemoteEvents";
import type {
	BlockLogicBothDefinitions,
	BlockLogicArgs,
	AllInputKeysToObject,
	AllOutputKeysToObject,
	BlockLogicFullBothDefinitions,
} from "shared/blockLogic/BlockLogic";
import type {
	BlockBuilderWithoutIdAndDefaults,
	BlockCategoryPath,
	BlockLogicInfo,
	BlockModelSource,
} from "shared/blocks/Block";

type CalcFunc<TDef extends BlockLogicBothDefinitions> = (
	inputs: AllInputKeysToObject<TDef["input"]>,
	block: AutoMathBlock<TDef>,
) => AllOutputKeysToObject<TDef["output"]>;

class AutoMathBlock<TDef extends BlockLogicBothDefinitions> extends CalculatableBlockLogic<TDef> {
	constructor(
		definition: TDef,
		args: BlockLogicArgs,
		private readonly calcfunc: CalcFunc<TDef>,
	) {
		super(definition, args);
	}

	protected override calculate(inputs: AllInputKeysToObject<TDef["input"]>): AllOutputKeysToObject<TDef["output"]> {
		return this.calcfunc(inputs, this);
	}
}
const logic = <TDef extends BlockLogicFullBothDefinitions>(definition: TDef, calcfunc: CalcFunc<TDef>) => {
	class ctor extends AutoMathBlock<TDef> {
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

const categories = {
	math: ["Logic", "Math"],
	byte: ["Logic", "Math", "Byte"],
	converterByte: ["Logic", "Converter", "Byte"],
	converterVector: ["Logic", "Converter", "Vector"],
	other: ["Logic", "Other"],
	bool: ["Logic", "Gate"],
	memory: ["Logic", "Memory"],
} as const satisfies { readonly [k in string]: BlockCategoryPath };

//

const defs = {
	num1_num: {
		input: {
			value: {
				displayName: "Value",
				types: BlockConfigDefinitions.number,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: BlockConfigDefinitions.number,
			},
		},
	},
	num2_num: {
		input: {
			value1: {
				displayName: "Value 1",
				types: BlockConfigDefinitions.number,
			},
			value2: {
				displayName: "Value 2",
				types: BlockConfigDefinitions.number,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: BlockConfigDefinitions.number,
			},
		},
	},
} as const satisfies { readonly [k in string]: BlockLogicFullBothDefinitions };

//

const mathBlocks = {
	add: {
		displayName: "Addition",
		description: "Returns a sum of input values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "ADD", categories.math),
		logic: logic(defs.num2_num, (inputs) => ({
			result: { type: "number", value: inputs.value1 + inputs.value2 },
		})),
	},
	sub: {
		displayName: "Subtraction",
		description: "Returns the result of substruction of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "SUB", categories.math),
		logic: logic(defs.num2_num, (inputs) => ({
			result: { type: "number", value: inputs.value1 - inputs.value2 },
		})),
	},
	mul: {
		displayName: "Multiplication",
		description: "Returns the result of multiplication of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "MUL", categories.math),
		logic: logic(defs.num2_num, (inputs) => ({
			result: { type: "number", value: inputs.value1 * inputs.value2 },
		})),
	},
	div: {
		displayName: "Division",
		description: "Returns the result of division of two given values",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "DIV", categories.math),
		logic: logic(defs.num2_num, (inputs, logic) => {
			if (inputs.value2 === 0) {
				if (logic.instance?.PrimaryPart) {
					RemoteEvents.Burn.send([logic.instance.PrimaryPart]);
				}

				logic.disable();
			}

			return { result: { type: "number", value: inputs.value1 / inputs.value2 } };
		}),
	},
	mod: {
		displayName: "Mod",
		description: "Returns the remainder of a division",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "MOD", categories.math),
		logic: logic(defs.num2_num, (inputs, logic) => {
			if (inputs.value2 === 0) {
				if (logic.instance?.PrimaryPart) {
					RemoteEvents.Burn.send([logic.instance.PrimaryPart]);
				}

				logic.disable();
			}

			return { result: { type: "number", value: inputs.value1 % inputs.value2 } };
		}),
	},

	abs: {
		displayName: "Absolute",
		description: "Returns the modulus of incoming number",
		modelSource: autoModel("GenericLogicBlockPrefab", "ABS", categories.math),
		logic: logic(defs.num1_num, (inputs) => ({
			result: { type: "number", value: math.abs(inputs.value) },
		})),
	},
	round: {
		displayName: "Round",
		description: "Returns rounded input value",
		modelSource: autoModel("GenericLogicBlockPrefab", "ABS", categories.math),
		logic: logic(defs.num1_num, (inputs) => ({
			result: { type: "number", value: math.round(inputs.value) },
		})),
	},
	floor: {
		displayName: "Floor",
		description: "N/A", // TODO: <
		modelSource: autoModel("GenericLogicBlockPrefab", "FLOOR", categories.math),
		logic: logic(defs.num1_num, (inputs) => ({
			result: { type: "number", value: math.floor(inputs.value) },
		})),
	},
	ceil: {
		displayName: "Ceil",
		description: "N/A", // TODO: <
		modelSource: autoModel("GenericLogicBlockPrefab", "CEIL", categories.math),
		logic: logic(defs.num1_num, (inputs) => ({
			result: { type: "number", value: math.ceil(inputs.value) },
		})),
	},
	sign: {
		displayName: "Sign",
		description: "Returns -1 if input value is less than zero, 1 if greater than zero and zero if equals zero",
		modelSource: autoModel("GenericLogicBlockPrefab", "SIGN", categories.math),
		logic: logic(defs.num1_num, (inputs) => ({
			result: { type: "number", value: math.sign(inputs.value) },
		})),
	},

	clamp: {
		displayName: "Clamp",
		description: "Limits the output between max and min.",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "CLAMP", categories.math),
		logic: logic(
			{
				input: {
					value: {
						displayName: "Value",
						types: BlockConfigDefinitions.number,
					},
					min: {
						displayName: "Min",
						types: BlockConfigDefinitions.number,
					},
					max: {
						displayName: "Max",
						types: BlockConfigDefinitions.number,
					},
				},
				output: {
					result: {
						displayName: "Result",
						types: BlockConfigDefinitions.number,
					},
				},
			},
			(inputs) => ({
				result: { type: "number", value: math.clamp(inputs.value, inputs.min, inputs.max) },
			}),
		),
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

//

const list = {
	...mathBlocks,
} satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };
export const MathBlocks = BlockCreation.arrayFromObject(list);

export type MathBlockIds = keyof typeof list;
